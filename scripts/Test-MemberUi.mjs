// Real local Edge DOM/layout checks; ALL browser API traffic is intercepted.
// This is a UI test with synthetic responses, never a provider/backend E2E test.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const origin = "http://127.0.0.1:3100";
const debugOrigin = "http://127.0.0.1:9333";
const output = path.resolve("artifacts/member-ui", new Date().toISOString().replaceAll(/[:.]/g, "-"));
await fs.mkdir(output, { recursive: true });
const target = await fetch(`${debugOrigin}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((r) => r.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let serial = 0;
const pending = new Map();
const listeners = new Map();
function send(method, params = {}) {
  const id = ++serial;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
socket.onmessage = ({ data }) => {
  const event = JSON.parse(data);
  if (event.id) {
    const waiter = pending.get(event.id);
    if (!waiter) return;
    clearTimeout(waiter.timeout); pending.delete(event.id);
    if (event.error) waiter.reject(new Error(event.error.message)); else waiter.resolve(event.result);
  } else for (const listener of listeners.get(event.method) ?? []) void listener(event.params);
};
const on = (name, fn) => listeners.set(name, [...(listeners.get(name) ?? []), fn]);
const results = [];
const calls = [];
let loggedIn = false;
let rejectLogin = true;
const member = { id: "11111111-1111-1111-1111-111111111111", email: "ui-qa@example.test", fullName: "Khách Kiểm Thử", phoneNumber: "0900000000", role: "Customer", emailVerified: true };
const auth = () => ({ accessToken: "synthetic-ui-only-not-a-real-jwt", accessTokenExpiresAt: new Date(Date.now() + 900000).toISOString(), user: member });
let interceptionError;
let completed = false;
on("Fetch.requestPaused", async ({ requestId, request }) => {
  try {
    const url = new URL(request.url);
    if (url.origin !== origin) {
      await send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" });
      return;
    }
    if (!url.pathname.startsWith("/api/")) { await send("Fetch.continueRequest", { requestId }); return; }
    const route = url.pathname;
    calls.push({ route, method: request.method }); // No bodies, cookies or credentials in evidence.
    let status = 200, data = [], code;
    if (route === "/api/auth/csrf") data = { csrfToken: "synthetic-ui-csrf" };
    else if (route === "/api/auth/refresh-token") {
      if (loggedIn) data = auth(); else { status = 401; code = "SESSION_EXPIRED"; }
    } else if (route === "/api/auth/login") {
      const payload = JSON.parse(request.postData);
      assert.deepEqual(Object.keys(payload).sort(), ["email", "password"]);
      if (rejectLogin) { status = 401; code = "INVALID_CREDENTIALS"; }
      else { loggedIn = true; data = auth(); }
    } else if (route === "/api/auth/register") {
      const payload = JSON.parse(request.postData);
      assert.equal(payload.email, member.email);
      assert.equal(payload.fullName, member.fullName);
      assert.ok(!("passwordConfirmation" in payload));
      status = 201; data = { userId: member.id, email: member.email };
    } else if (route === "/api/auth/logout") { loggedIn = false; data = null; }
    else if (route === "/api/account/me" || route === "/api/auth/me") data = member;
    else if (route === "/api/account/addresses") data = [{ id: "qa-address", recipientName: member.fullName, phoneNumber: member.phoneNumber, province: "QA", district: "QA", ward: "QA", detailAddress: "Địa chỉ thử nghiệm", isDefault: true }];
    else if (route === "/api/orders" && request.method === "GET") data = {
      items: [{ orderCode: "QA-UI-ONLY", createdAt: "2026-10-26T00:00:00Z", totalAmount: 100000, status: "Pending", paymentStatus: "Unpaid", itemCount: 1 }], totalCount: 1, pageNumber: 1, pageSize: 10, totalPages: 1,
    };
    else if (route.startsWith("/api/auth/external/")) { status = 400; code = "INVALID_HANDOFF"; }
    else if (!["GET", "HEAD"].includes(request.method)) throw new Error("Unexpected mutation blocked");
    await send("Fetch.fulfillRequest", { requestId, responseCode: status,
      responseHeaders: [{ name: "Content-Type", value: "application/json" }],
      body: Buffer.from(JSON.stringify({ success: status < 400, data, ...(code ? { code } : {}) })).toString("base64") });
  } catch (error) {
    interceptionError = error;
    await send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" });
  }
});
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result?.value;
}
async function until(expression) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`UI condition timed out: ${expression}`);
}
async function navigate(route) {
  await send("Page.navigate", { url: origin + route });
  await until(`location.pathname === ${JSON.stringify(route.split("?")[0])} && document.readyState === 'complete' && !!document.querySelector('main')`);
  if (["/login", "/register"].includes(route)) {
    await until("!!document.querySelector('header a[aria-label=\"Đăng nhập tài khoản\"]') && Array.from(document.querySelectorAll('main input')).every(i=>Object.keys(i).some(k=>k.startsWith('__reactProps')))");
  }
}
async function fill(id, value) {
  await evaluate(`(() => { const input = document.getElementById(${JSON.stringify(id)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', {bubbles:true})); })()`);
}
async function screenshot(name) {
  await until("Array.from(document.images).every(image => image.complete)");
  const metrics = await send("Page.getLayoutMetrics");
  const size = metrics.cssContentSize;
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 } });
  await fs.writeFile(path.join(output, `${name}.png`), Buffer.from(shot.data, "base64"));
}
const pass = (name) => { results.push({ name, passed: true }); console.log(`PASS ${name}`); };
try {
  await send("Page.enable"); await send("Runtime.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
  for (const [label, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844], ["small-mobile", 320, 740]]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    for (const route of ["login", "register"]) {
      await navigate(`/${route}`);
      await until("!document.querySelector('main form')?.getAttribute('aria-busy')?.includes('true')");
      assert.equal(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), true);
      const buttons = await evaluate("Array.from(document.querySelectorAll('main button')).filter(b => /Google|Facebook/.test(b.textContent)).map(b => ({label:b.textContent,disabled:b.disabled,width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height}))");
      assert.equal(buttons.length, 2);
      assert.ok(buttons.every((b) => b.disabled && b.label.includes("Chưa khả dụng") && b.width > 200 && b.height >= 48));
      assert.equal(await evaluate("Array.from(document.querySelectorAll('main label')).every(l => !!l.htmlFor && !!document.getElementById(l.htmlFor))"), true);
      await screenshot(`${route}-${label}`);
      pass(`${route} ${label}: visible social buttons, labels, no horizontal overflow`);
    }
  }
  await navigate("/register");
  await fill("register-name", member.fullName); await fill("register-email", member.email);
  await fill("register-password", "Synthetic-only-123"); await fill("register-confirmation", "Mismatch-only-123");
  await evaluate("document.querySelector('main form').requestSubmit()");
  await until("document.querySelector('[role=alert]')?.textContent.includes('chưa khớp')");
  assert.equal(calls.filter((c) => c.route === "/api/auth/register").length, 0);
  pass("password mismatch blocks registration before API");
  await evaluate("document.querySelector('[aria-controls=register-password]').click()");
  assert.equal(await evaluate("document.getElementById('register-password').type"), "text");
  await evaluate("document.querySelector('[aria-controls=register-password]').click()");
  assert.equal(await evaluate("document.getElementById('register-password').type"), "password");
  pass("password visibility toggle");
  await fill("register-confirmation", "Synthetic-only-123");
  await evaluate("document.querySelector('main form').requestSubmit()");
  await until("document.querySelector('main [role=status]')?.textContent.includes('Đăng ký thành công')");
  await new Promise((resolve) => setTimeout(resolve, 1800));
  assert.equal(await evaluate("location.pathname"), "/register");
  assert.equal(calls.filter((c) => c.route === "/api/auth/register").length, 1);
  assert.equal(await evaluate("document.querySelector('main button[type=submit]').disabled"), true);
  await screenshot("register-success-mobile");
  pass("registration synthetic response: persistent verification instructions and duplicate-submit guard");
  await navigate("/login");
  await until("!document.querySelector('main button[type=submit]').disabled");
  await fill("login-email", member.email); await fill("login-password", "Synthetic-only-123");
  await evaluate("document.querySelector('main form').requestSubmit()");
  await until("document.querySelector('[role=alert]')?.textContent.includes('không đúng')");
  await screenshot("login-error-mobile");
  pass("invalid credentials show accessible error");
  rejectLogin = false;
  await evaluate("document.querySelector('main form').requestSubmit()");
  await until("location.pathname === '/account' && document.body.innerText.includes('Địa chỉ thử nghiệm') && document.body.innerText.includes('QA-UI-ONLY')");
  await evaluate("document.querySelector('header button[aria-controls=header-member-menu]').click()");
  await until("document.getElementById('header-member-menu')?.textContent.includes('Khách Kiểm Thử')");
  assert.equal(await evaluate("!!document.querySelector('#header-member-menu a[href=\"/orders\"]')"), true);
  await screenshot("account-mobile-synthetic");
  pass("synthetic login: account redirect, Header name/menu, saved addresses and order history");
  await evaluate("Array.from(document.querySelectorAll('#header-member-menu button')).find(b=>b.textContent.includes('Đăng xuất')).click()");
  await until("document.body.innerText.includes('Bạn cần đăng nhập để xem tài khoản') && !!document.querySelector('header a[aria-label=\"Đăng nhập tài khoản\"]')");
  assert.equal(await evaluate("document.body.innerText.includes('Địa chỉ thử nghiệm') || document.body.innerText.includes('QA-UI-ONLY')"), false);
  pass("logout clears Header and member-specific account content");
  await navigate("/auth/callback?accessToken=synthetic-rejected");
  await until("location.search === '' && document.body.innerText.includes('bắt đầu lại')");
  pass("callback rejects token URL and scrubs query");
  await navigate("/login");
  await evaluate("document.querySelector('main a[href=\"/register\"]').click()");
  await until("location.pathname === '/register' && !!document.getElementById('register-confirmation')");
  await evaluate("document.querySelector('main a[href=\"/login\"]').click()");
  await until("location.pathname === '/login' && !!document.getElementById('login-password')");
  await evaluate("document.querySelector('main a[href=\"/forgot-password\"]').click()");
  await until("location.pathname === '/forgot-password' && !!document.querySelector('main input[type=email]')");
  pass("login, create-account and forgot-password links navigate correctly");
  if (interceptionError) throw interceptionError;
  completed = true;
} catch (error) {
  console.error("UI diagnostic:", await evaluate("JSON.stringify({path:location.pathname,alerts:Array.from(document.querySelectorAll('[role=alert]')).map(e=>e.textContent),inputs:Array.from(document.querySelectorAll('main input')).map(e=>({id:e.id,length:e.value.length,valid:e.validity.valid})),busy:document.querySelector('main form')?.getAttribute('aria-busy')})"));
  await screenshot("failure").catch(() => {});
  throw error;
} finally {
  await fs.writeFile(path.join(output, "result.json"), JSON.stringify({ completed, passed: completed, origin, browser: "Edge CDP", syntheticApi: true, realProviderLogin: false, realBackendTest: false, results }, null, 2));
  await send("Target.closeTarget", { targetId: target.id }).catch(() => {});
  socket.close();
  console.log(`Evidence: ${output}`);
}
