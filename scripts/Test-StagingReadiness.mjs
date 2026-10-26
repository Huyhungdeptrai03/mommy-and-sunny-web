import { pathToFileURL } from "node:url";

export function stagingOrigin(value, verified) {
  if (!value || !verified) throw new Error("BLOCKED: supply an isolated staging origin and --verified-isolated-staging.");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("BLOCKED: expected a trusted HTTPS origin, without credentials/path/query.");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const stageName = /(^|[.-])(staging|stage|qa|test)([.-]|$)/i.test(url.hostname) || url.hostname.endsWith(".test");
  if (!loopback && !stageName) throw new Error("BLOCKED: use an explicitly named QA/staging host, never the production origin.");
  return url.origin;
}

export function cookieAttributes(setCookie) {
  return {
    secure: /;\s*Secure(?:;|$)/i.test(setCookie),
    httpOnly: /;\s*HttpOnly(?:;|$)/i.test(setCookie),
    sameSiteLax: /;\s*SameSite=Lax(?:;|$)/i.test(setCookie),
    hostOnly: !/;\s*Domain=/i.test(setCookie),
    pathRoot: /;\s*Path=\/(?:;|$)/i.test(setCookie),
  };
}

async function run() {
  const args = new Set(process.argv.slice(2));
  const origin = stagingOrigin(process.env.MOMMY_AUTH_STAGING_ORIGIN, args.has("--verified-isolated-staging"));
  const checks = [];
  async function request(path, options = {}) {
    return fetch(origin + path, { ...options, redirect: "manual", signal: AbortSignal.timeout(15000) });
  }
  function record(name, passed, detail) { checks.push({ name, passed, ...(detail ? { detail } : {}) }); }

  // No authenticated requests, no registration, no orders, no external redirects.
  for (const path of ["/login", "/account", "/auth/callback", "/verify-email", "/reset-password"]) {
    const response = await request(path);
    record("route " + path, response.status === 200, { status: response.status });
    if (["/auth/callback", "/verify-email", "/reset-password"].includes(path)) {
      record("sensitive headers " + path,
        response.headers.get("referrer-policy") === "no-referrer" &&
        (response.headers.get("cache-control") ?? "").includes("no-store"));
    }
    await response.body?.cancel();
  }
  const csrf = await request("/api/auth/csrf");
  const payload = await csrf.json().catch(() => null);
  const cookie = csrf.headers.getSetCookie().find(value => value.startsWith("__Host-ms-csrf="));
  const csrfToken = payload?.data?.csrfToken;
  record("CSRF endpoint and reverse proxy", csrf.status === 200 && payload?.success === true && typeof csrfToken === "string");
  const attributes = cookie ? cookieAttributes(cookie) : null;
  record("CSRF cookie flags", attributes !== null && Object.values(attributes).every(Boolean), attributes);

  for (const path of ["/api/auth/me", "/api/account/me", "/api/admin/users", "/api/cart", "/api/orders", "/api/account/addresses"]) {
    const response = await request(path);
    record("anonymous denied " + path, response.status === 401, { status: response.status });
    await response.body?.cancel();
  }
  // Missing CSRF/Origin must reject BEFORE credentials are checked. Dummy data only.
  for (const path of ["/api/auth/login", "/api/auth/refresh-token", "/api/auth/logout"]) {
    const response = await request(path, { method: "POST", headers: { "Content-Type": "application/json" },
      ...(path.endsWith("/login") ? { body: JSON.stringify({ email: "qa-csrf-negative@example.invalid", password: "not-a-real-account-password" }) } : {}) });
    record("missing CSRF rejected " + path, response.status === 403, { status: response.status });
    await response.body?.cancel();
  }
  if (typeof csrfToken === "string" && cookie) {
    const response = await request("/api/auth/refresh-token", { method: "POST", headers: {
      Origin: origin, Cookie: cookie.split(";")[0], "X-CSRF-TOKEN": csrfToken,
    } });
    const data = await response.json().catch(() => null);
    record("refresh without member cookie", response.status === 401 && data?.code === "SESSION_EXPIRED", { status: response.status });
  }
  const mock = await request("/api/payments/mock-qr?orderCode=QA-NO-ORDER&amount=100000");
  if (args.has("--development-mock")) {
    const content = await mock.text();
    record("non-payable Development mock image", mock.status === 200 &&
      (mock.headers.get("content-type") ?? "").startsWith("image/svg+xml") && content.includes("NO MONEY TRANSFER"));
  } else {
    record("mock disabled in Staging", mock.status === 404, { status: mock.status });
    await mock.body?.cancel();
  }
  console.log(JSON.stringify({ type: "unauthenticated-staging-HTTP-smoke", checks,
    authenticatedBrowserE2E: "NOT_RUN", realOrdersCreated: 0, realPayments: 0 }, null, 2));
  process.exitCode = checks.every(check => check.passed) ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(error => {
    // No raw response/cookie/token/configuration in error output.
    console.error(error instanceof Error && error.message.startsWith("BLOCKED:") ? error.message : "Staging smoke could not complete; check TLS/network and isolated staging setup.");
    process.exitCode = 2;
  });
}
