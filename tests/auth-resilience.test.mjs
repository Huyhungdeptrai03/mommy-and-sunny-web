import { test as nodeTest } from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { createTab, browserGroup, standardAdapter, fail, tick, ok, authResult } from "./auth-harness.mjs";
const test = (name, run) => nodeTest(name, { timeout: 5000 }, run);

function rejected(config, status, code, retryAfter = "60") {
  throw new axios.AxiosError("Test rejection", "ERR_BAD_RESPONSE", config, null, {
    config, status, data: { success: false, code }, headers: { "retry-after": retryAfter },
  });
}

test("three tabs bootstrap once each: six requests, three serialized rotations, no extra member GET", async () => {
  const group = browserGroup(), clock = { now: Date.now() };
  let active = 0, peak = 0;
  const adapter = async (config) => {
    if (config.url === "/auth/refresh-token") { peak = Math.max(peak, ++active); await tick(); active--; }
    return standardAdapter(config);
  };
  const tabs = [0,1,2].map(() => createTab(adapter, { group, clock }));
  await Promise.all(tabs.flatMap((tab) => {
    const first = tab.session().initializeSession();
    assert.equal(tab.session().initializeSession(), first);
    return [first, first, first];
  }));
  assert.equal(tabs.flatMap(tab => tab.calls).length, 6);
  assert.equal(tabs.flatMap(tab => tab.calls).filter(call => call.url === "/auth/refresh-token").length, 3);
  assert.equal(peak, 1);
  assert.ok(tabs.every(tab => tab.store().getState().status === "authenticated"));
});

test("reproduced three-tab 21-request logout stays authenticated after optimization", async () => {
  const group = browserGroup(), clock = { now: Date.now() };
  let count = 0;
  const adapter = config => ++count > 20 ? fail(config, 429, "RATE_LIMITED") : standardAdapter(config);
  const tabs = [0,1,2].map(() => createTab(adapter, { group, clock }));
  await Promise.all(tabs.map(tab => tab.session().initializeSession()));
  for (let round = 0; round < 4; round++) {
    clock.now += 60000;
    await Promise.all(tabs.flatMap(tab => [tab.session().revalidateSession(), tab.session().revalidateSession()]));
    await tick();
  }
  assert.equal(count, 18); // Before: 9 + 12 = 21. After: 6 + 12 = 18.
  assert.ok(tabs.every(tab => tab.store().getState().status === "authenticated"));
});

test("focus storms are deduplicated and successful AuthResult is a fresh validation", async () => {
  const clock = { now: Date.now() }, tab = createTab(standardAdapter, { clock });
  await tab.session().initializeSession();
  await Promise.all(Array.from({ length: 30 }, () => tab.session().revalidateSession()));
  assert.equal(tab.calls.length, 2);
  clock.now += 60000;
  await Promise.all(Array.from({ length: 30 }, () => tab.session().revalidateSession()));
  assert.equal(tab.calls.filter(call => call.url === "/auth/me").length, 1);
});

test("member GET 429 preserves identity and respects Retry-After without retry loop", async () => {
  const clock = { now: Date.now() }; let limited = true;
  const tab = createTab(config => config.url === "/auth/me" && limited
    ? rejected(config, 429, "RATE_LIMITED", "120") : standardAdapter(config), { clock });
  await tab.session().signIn("member@example.test", "password");
  const generation = tab.store().getState().generation;
  clock.now += 60000;
  await tab.session().revalidateSession();
  assert.equal(tab.store().getState().status, "authenticated");
  assert.equal(tab.store().getState().generation, generation);
  assert.equal(tab.store().getState().retryAt, clock.now + 120000);
  const calls = tab.calls.length;
  clock.now += 119999;
  await tab.session().revalidateSession();
  assert.equal(tab.calls.length, calls);
  limited = false; clock.now++;
  await tab.session().revalidateSession();
  assert.equal(tab.calls.length, calls + 1);
  assert.equal(tab.store().getState().notice, null);
});

test("refresh 429 keeps a valid JWT; cached anonymous CSRF is not fetched again", async () => {
  const clock = { now: Date.now() }; let limited = true;
  const tab = createTab(config => config.url === "/auth/refresh-token" && limited
    ? rejected(config, 429, "RATE_LIMITED", "30") : standardAdapter(config), { clock });
  await tab.session().signIn("member@example.test", "password");
  await assert.rejects(tab.session().refreshSession());
  assert.equal(tab.store().getState().status, "authenticated");
  assert.equal(await tab.session().ensureAccessToken(), "a-access");
  const calls = tab.calls.length;
  await assert.rejects(tab.session().refreshSession(), /AUTH_RETRY_LATER/);
  assert.equal(tab.calls.length, calls);
  limited = false; clock.now += 30000;
  await tab.session().refreshSession();
  assert.equal(tab.calls.filter(call => call.url === "/auth/csrf").length, 1);
});

test("HTTP-date Retry-After and malformed values are parsed conservatively", () => {
  const tab = createTab(standardAdapter);
  const { retryAfterTime } = tab.load("features/auth/retry.ts");
  const now = Date.parse("2026-10-26T10:00:00Z");
  assert.equal(retryAfterTime("120", now), now + 120000);
  assert.equal(retryAfterTime("Mon, 26 Oct 2026 10:02:00 GMT", now), now + 120000);
  assert.equal(retryAfterTime("0", now), now);
  for (const value of [undefined, "bad", "-1", "999999999999999999999999"]) assert.equal(retryAfterTime(value, now), now + 60000);
});

test("temporary CSRF failure leaves bootstrap unresolved rather than anonymous and can recover safely", async () => {
  const clock = { now: Date.now() }; let unavailable = true;
  const tab = createTab(config => config.url === "/auth/csrf" && unavailable
    ? rejected(config, 503, "REQUEST_FAILED") : standardAdapter(config), { clock });
  await tab.session().initializeSession();
  assert.equal(tab.store().getState().status, "checking");
  assert.equal(tab.store().getState().recoveryRequiresLogin, false);
  await tab.session().initializeSession();
  assert.equal(tab.calls.length, 1);
  unavailable = false; clock.now += 60000;
  await tab.session().revalidateSession();
  assert.equal(tab.store().getState().status, "authenticated");
  assert.equal(tab.calls.filter(call => call.url === "/auth/refresh-token").length, 1);
});

test("lost or 5xx refresh response is not replayed and does not revoke local identity", async () => {
  for (const network of [false, true]) {
    const clock = { now: Date.now() };
    const tab = createTab(config => {
      if (config.url === "/auth/refresh-token") {
        if (network) throw new axios.AxiosError("Offline", "ERR_NETWORK", config);
        return rejected(config, 503, "REQUEST_FAILED");
      }
      return standardAdapter(config);
    }, { clock });
    await tab.session().signIn("member@example.test", "password");
    await assert.rejects(tab.session().refreshSession());
    assert.equal(tab.store().getState().status, "authenticated");
    assert.equal(tab.store().getState().recoveryRequiresLogin, true);
    clock.now += 120000;
    await tab.session().revalidateSession();
    await assert.rejects(tab.session().refreshSession(), /AUTH_REAUTHENTICATION_REQUIRED/);
    assert.equal(tab.calls.filter(call => call.url === "/auth/refresh-token").length, 1);
  }
});

test("429 in one tab does not broadcast logout to another tab", async () => {
  const group = browserGroup(), clock = { now: Date.now() }; let limited = false;
  const adapter = config => config.url === "/auth/me" && limited ? rejected(config, 429, "RATE_LIMITED") : standardAdapter(config);
  const a = createTab(adapter, { group, clock }), b = createTab(adapter, { group, clock });
  await a.session().initializeSession(); await b.session().initializeSession();
  limited = true; clock.now += 60000;
  await a.session().revalidateSession(); await tick();
  assert.equal(a.store().getState().status, "authenticated");
  assert.equal(b.store().getState().status, "authenticated");
  const count = b.calls.length;
  await b.session().revalidateSession();
  assert.equal(b.calls.length, count);
});

test("session expiry/revocation/conflict remain definitive and broadcast invalidation", async () => {
  for (const [status, code] of [[401, "SESSION_EXPIRED"], [401, "SESSION_REVOKED"], [409, "REFRESH_CONFLICT"]]) {
    const tab = createTab(config => config.url === "/auth/refresh-token" ? rejected(config, status, code) : standardAdapter(config));
    await tab.session().signIn("member@example.test", "password");
    await assert.rejects(tab.session().refreshSession());
    assert.equal(tab.store().getState().status, "anonymous");
    assert.equal(await tab.session().ensureAccessToken(), null);
  }
});

test("temporary member read network failure does not clear the current account", async () => {
  const clock = { now: Date.now() };
  const tab = createTab(config => {
    if (config.url === "/auth/me") throw new axios.AxiosError("Offline", "ERR_NETWORK", config);
    return standardAdapter(config);
  }, { clock });
  await tab.session().signIn("member@example.test", "password");
  clock.now += 60000;
  await tab.session().revalidateSession();
  assert.equal(tab.store().getState().user.id, "a");
  assert.equal(tab.store().getState().status, "authenticated");
  assert.equal(tab.store().getState().recoveryRequiresLogin, false);
});

test("payment navigation accepts production/mock HTTPS images and rejects inline or unsafe payloads", () => {
  const tab = createTab(standardAdapter);
  const { paymentRedirectUrl } = tab.load("features/checkout/payment-url.ts");
  for (const url of ["https://vietqr.app/img?acc=TEST&amount=100000&des=MS001", "https://shop.test/api/payments/mock-qr?orderCode=MS001&amount=100000"]) assert.equal(paymentRedirectUrl(url), url);
  for (const value of [null, undefined, "", "bad", "data:image/svg+xml;base64,AAA", "javascript:alert(1)", "http://shop.test/image", "https://user:pass@shop.test/image"]) assert.equal(paymentRedirectUrl(value), null);
});

test("failed order/payment response is not retried or mistaken for a successful payment", async () => {
  for (const status of [400, 429, 503]) {
    const tab = createTab(config => config.url === "/orders" ? rejected(config, status, "REQUEST_FAILED") : standardAdapter(config));
    await tab.session().signIn("member@example.test", "password");
    await assert.rejects(tab.load("features/orders/api.ts").createOrder({ addressId: "a", paymentMethod: "SePay" }));
    assert.equal(tab.calls.filter(call => call.url === "/orders").length, 1);
    assert.equal(tab.store().getState().status, "authenticated");
  }
});

test("an expired JWT is never sent to order creation after uncertain refresh", async () => {
  const clock = { now: Date.now() };
  const tab = createTab(config => {
    if (config.url === "/auth/login") return ok(config, { ...authResult(), accessTokenExpiresAt: new Date(clock.now + 60000).toISOString() });
    if (config.url === "/auth/refresh-token") return rejected(config, 503, "REQUEST_FAILED");
    return standardAdapter(config);
  }, { clock });
  await tab.session().signIn("member@example.test", "password");
  clock.now += 31000;
  assert.equal(await tab.session().ensureAccessToken(), "a-access");
  clock.now += 30000;
  await assert.rejects(tab.client().post("/orders", { paymentMethod: "SePay" }), /AUTH_REAUTHENTICATION_REQUIRED/);
  assert.equal(tab.calls.filter(call => call.url === "/orders").length, 0);
  assert.equal(tab.calls.filter(call => call.url === "/auth/refresh-token").length, 1);
});
