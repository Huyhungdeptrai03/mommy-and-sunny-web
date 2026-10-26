import { test as nodeTest } from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createTab, browserGroup, deferred, tick, ok, fail, authResult, user, standardAdapter } from "./auth-harness.mjs";
const test = (name, run) => nodeTest(name, { timeout: 5000 }, run);

test("reload uses anonymous CSRF and cookie rotation, not persisted credentials", async () => {
  const tab = createTab(standardAdapter);
  await tab.session().initializeSession();
  assert.equal(tab.store().getState().status, "authenticated");
  assert.deepEqual(tab.removed, ["mommy-and-sunny-auth"]);
  assert.deepEqual(tab.writes, []);
  assert.ok(!("accessToken" in tab.store().getState()));
  assert.ok(!("refreshToken" in tab.store().getState()));
  const refresh = tab.calls.find((call) => call.url === "/auth/refresh-token");
  assert.equal(refresh.baseURL, "/api");
  assert.equal(refresh.withCredentials, true);
  assert.equal(refresh.data, undefined);
  assert.equal(refresh.headers.get("Authorization"), undefined);
  assert.equal(refresh.headers.get("X-CSRF-TOKEN"), "csrf-request");
  assert.equal(tab.calls.filter((call) => call.url === "/auth/me").length, 0);
  assert.equal(tab.store().getState().user.id, "a");
});

test("concurrent refresh calls share one promise and every failure settles", async () => {
  const pending = deferred();
  const tab = createTab((config) => config.url === "/auth/refresh-token" ? pending.promise : standardAdapter(config));
  const first = tab.session().refreshSession();
  const second = tab.session().refreshSession();
  assert.equal(first, second);
  const results = Promise.allSettled([first, second]);
  await tick();
  pending.reject(new Error("Network error"));
  assert.ok((await results).every((result) => result.status === "rejected"));
  assert.equal(tab.calls.filter((call) => call.url === "/auth/refresh-token").length, 1);
  assert.equal(tab.store().getState().status, "checking");
  assert.equal(tab.store().getState().recoveryRequiresLogin, true);
});

test("logout while refresh is in flight cannot restore old state", async () => {
  const pending = deferred();
  let refreshConfig;
  const tab = createTab((config) => {
    if (config.url === "/auth/refresh-token") { refreshConfig = config; return pending.promise; }
    return standardAdapter(config);
  });
  const refresh = assert.rejects(tab.session().refreshSession(), axios.isCancel);
  await tick();
  const logout = tab.session().signOut();
  pending.resolve(ok(refreshConfig, authResult()));
  await Promise.all([refresh, logout]);
  assert.equal(tab.store().getState().status, "anonymous");
  assert.equal(await tab.session().ensureAccessToken(), null);
  const call = tab.calls.find((item) => item.url === "/auth/logout");
  assert.equal(call.headers.get("Authorization"), undefined);
  assert.equal(call.data, undefined);
});

test("failed logout reports that server revocation is unconfirmed", async () => {
  const tab = createTab((config) => config.url === "/auth/logout" ? Promise.reject(new Error("Offline")) : standardAdapter(config));
  await assert.rejects(tab.session().signOut());
  assert.equal(tab.store().getState().status, "anonymous");
  assert.match(tab.store().getState().notice, /chưa xác nhận/);
});

test("two browser tabs serialize refresh rotation with the same Web Lock", async () => {
  const group = browserGroup();
  let active = 0, maximum = 0;
  async function adapter(config) {
    if (config.url === "/auth/refresh-token") {
      maximum = Math.max(maximum, ++active);
      await tick();
      active--;
    }
    return standardAdapter(config);
  }
  const a = createTab(adapter, { group }), b = createTab(adapter, { group });
  await Promise.all([a.session().refreshSession(), b.session().refreshSession()]);
  assert.equal(maximum, 1);
  assert.equal(a.store().getState().user.id, "a");
  assert.equal(b.store().getState().user.id, "a");
});

test("logout notification clears another tab without broadcasting tokens", async () => {
  const group = browserGroup();
  const a = createTab(standardAdapter, { group }), b = createTab(standardAdapter, { group });
  await a.session().initializeSession();
  await b.session().initializeSession();
  b.load("store/cartStore.ts").useCartStore.getState().setItemCount(4);
  await a.session().signOut();
  await tick();
  assert.equal(b.store().getState().status, "anonymous");
  assert.equal(b.load("store/cartStore.ts").useCartStore.getState().itemCount, 0);
});

test("refresh conflict does not retry and expires the session", async () => {
  const tab = createTab((config) => config.url === "/auth/refresh-token" ? fail(config, 409, "REFRESH_CONFLICT") : standardAdapter(config));
  await assert.rejects(tab.session().refreshSession());
  assert.equal(tab.calls.filter((call) => call.url === "/auth/refresh-token").length, 1);
  assert.equal(tab.store().getState().status, "anonymous");
});

test("unsupported Web Locks fail closed before rotating cookies", async () => {
  const tab = createTab(standardAdapter, { locks: false });
  await assert.rejects(tab.session().refreshSession(), /WEB_LOCKS_REQUIRED/);
  assert.equal(tab.calls.length, 0);
});

test("login never sends Bearer and failed login does not trigger refresh", async () => {
  const tab = createTab((config) => config.url === "/auth/login" ? fail(config, 401, "INVALID_CREDENTIALS") : standardAdapter(config));
  await assert.rejects(tab.session().signIn("member@example.test", "password"));
  assert.equal(tab.calls.length, 2);
  assert.ok(tab.calls.every((call) => !call.headers.get("Authorization")));
});

test("GET 401 has at most one retry; 403 and network errors never refresh", async () => {
  for (const status of [401, 403, 0]) {
    const tab = createTab((config) => {
      if (config.url === "/orders") {
        if (!status) throw new axios.AxiosError("Network", "ERR_NETWORK", config);
        return fail(config, status);
      }
      return standardAdapter(config);
    });
    await tab.session().signIn("member@example.test", "password");
    await assert.rejects(tab.client().get("/orders"));
    assert.equal(tab.calls.filter((call) => call.url === "/orders").length, status === 401 ? 2 : 1);
    assert.equal(tab.calls.filter((call) => call.url === "/auth/refresh-token").length, status === 401 ? 1 : 0);
  }
});

test("checkout/payment POST is never replayed after 401 or network error", async () => {
  for (const endpoint of ["/orders", "/payments"]) {
    for (const network of [true, false]) {
      const tab = createTab((config) => {
        if (config.url === endpoint) {
          if (network) throw new axios.AxiosError("Network", "ERR_NETWORK", config);
          return fail(config);
        }
        return standardAdapter(config);
      });
      await tab.session().signIn("member@example.test", "password");
      await assert.rejects(tab.client().post(endpoint, { paymentMethod: "SePay" }));
      assert.equal(tab.calls.filter((call) => call.url === endpoint).length, 1);
      assert.equal(tab.calls.filter((call) => call.url === "/auth/refresh-token").length, 0);
    }
  }
});

test("revoked Admin session loses client privileges without refresh", async () => {
  const tab = createTab((config) => config.url === "/admin/users" ? fail(config, 401, "SESSION_REVOKED") : standardAdapter(config));
  await tab.session().signIn("member@example.test", "password");
  await assert.rejects(tab.client().get("/admin/users"));
  assert.equal(tab.store().getState().user, null);
  assert.equal(tab.calls.filter((call) => call.url === "/auth/refresh-token").length, 0);
});

test("response from a previous account is canceled before it reaches consumers", async () => {
  const pending = deferred();
  let requestConfig;
  const tab = createTab((config) => {
    if (config.url === "/orders") { requestConfig = config; return pending.promise; }
    return standardAdapter(config);
  });
  await tab.session().signIn("member@example.test", "password");
  const request = assert.rejects(tab.client().get("/orders"), axios.isCancel);
  await tick();
  tab.session().clearSession();
  pending.resolve(ok(requestConfig, { items: [] }));
  await request;
});

test("OAuth URL only accepts contract parameters and is scrubbed", () => {
  const tab = createTab(standardAdapter, { pathname: "/auth/callback", search: "?code=opaque&emailToken=proof" });
  assert.equal(tab.session().captureOAuthCallback().code, "opaque");
  assert.equal(tab.window.location.search, "");
  const parse = tab.load("features/auth/safety.ts").parseOAuthCallback;
  for (const query of ["?accessToken=jwt", "?code=a&refreshToken=secret", "?code=a&code=b", "?returnTo=//evil", "?code="]) {
    assert.equal(parse(query).error, "INVALID_HANDOFF");
  }
});

test("OAuth exchange uses anonymous CSRF; explicit link uses principal-bound CSRF", async () => {
  const tab = createTab(standardAdapter);
  await tab.session().exchangeExternal("opaque");
  const first = tab.calls.find((call) => call.url === "/auth/external/exchange");
  assert.equal(first.headers.get("Authorization"), undefined);
  await tab.session().signIn("member@example.test", "password");
  tab.calls.length = 0;
  await tab.session().exchangeExternal("another", undefined, true);
  assert.equal(tab.calls[0].headers.get("Authorization"), "Bearer a-access");
  assert.equal(tab.calls[1].headers.get("Authorization"), "Bearer a-access");
  assert.equal(JSON.parse(tab.calls[1].data).linkExistingAccount, true);
});

test("handoff/link errors never create a frontend user or retry exchange", async () => {
  for (const code of ["ACCOUNT_LINK_REQUIRED", "INVALID_HANDOFF", "IDENTITY_CONFLICT", "EMAIL_VERIFICATION_REQUIRED"]) {
    const tab = createTab((config) => config.url === "/auth/external/exchange" ? fail(config, 409, code) : standardAdapter(config));
    await assert.rejects(tab.session().exchangeExternal("opaque"));
    assert.equal(tab.store().getState().user, null);
    assert.equal(tab.calls.filter((call) => call.url === "/auth/external/exchange").length, 1);
  }
});

test("email onboarding forwards only documented fields and CSRF", async () => {
  const tab = createTab(standardAdapter);
  await tab.session().submitExternalEmail("opaque", "member@example.test", "Thành viên");
  const call = tab.calls.find((item) => item.url === "/auth/external/email");
  assert.deepEqual(JSON.parse(call.data), { code: "opaque", email: "member@example.test", fullName: "Thành viên" });
  assert.equal(call.headers.get("Authorization"), undefined);
});

test("safe destinations and BCrypt byte limit reject dangerous inputs", () => {
  const tab = createTab(standardAdapter);
  const { safeDestination, validMemberPassword } = tab.load("features/auth/safety.ts");
  for (const input of ["https://evil.test", "//evil.test", "/\\evil", "/api/auth/login", "/%2fevil", "/auth/callback"]) {
    assert.equal(safeDestination(input), "/account");
  }
  assert.equal(safeDestination("/checkout?coupon=HELLO"), "/checkout?coupon=HELLO");
  assert.equal(validMemberPassword("a".repeat(72)), true);
  assert.equal(validMemberPassword("a".repeat(73)), false);
  assert.equal(validMemberPassword("界".repeat(25)), false);
});

test("protected account and Admin UI hide private content from anonymous/customer users", () => {
  for (const state of [
    { user: null, isAuthenticated: false, status: "anonymous" },
    { user: user(), isAuthenticated: true, status: "authenticated" },
  ]) {
    const tab = createTab(standardAdapter, { uiState: state });
    const AdminLayout = tab.load("app/admin/layout.tsx").default;
    const html = renderToStaticMarkup(React.createElement(AdminLayout, null, "PRIVATE_ADMIN_CONTENT"));
    assert.ok(!html.includes("PRIVATE_ADMIN_CONTENT"));
  }
  const tab = createTab(standardAdapter, { uiState: { user: null, isAuthenticated: false, status: "anonymous" } });
  const AccountView = tab.load("features/account/components/AccountView.tsx").default;
  assert.match(renderToStaticMarkup(React.createElement(AccountView)), /Bạn cần đăng nhập/);
});

test("profile update cannot send role or customer identity fields", async () => {
  const tab = createTab((config) => config.url === "/account/me" ? ok(config, user()) : standardAdapter(config));
  await tab.session().signIn("member@example.test", "password");
  await tab.load("features/account/api.ts").updateProfile({ fullName: "Tên mới", phoneNumber: null, role: "Admin", userId: "other" });
  assert.deepEqual(JSON.parse(tab.calls.find((call) => call.url === "/account/me").data), { fullName: "Tên mới", phoneNumber: null });
});

test("late 401 reuses a newer access token rather than rotating twice", async () => {
  const pending = deferred();
  let delayedConfig;
  const tab = createTab((config) => {
    if (config.url === "/auth/refresh-token") return ok(config, { ...authResult(), accessToken: "rotated-access" });
    if (config.url === "/cart" && !config._retry) { delayedConfig = config; return pending.promise; }
    if (config.url === "/orders" && !config._retry) return fail(config);
    return standardAdapter(config);
  });
  await tab.session().signIn("member@example.test", "password");
  const cart = tab.client().get("/cart");
  await tab.client().get("/orders");
  try { fail(delayedConfig); } catch (error) { pending.reject(error); }
  await cart;
  assert.equal(tab.calls.filter((call) => call.url === "/auth/refresh-token").length, 1);
});

test("business payloads and envelopes stay compatible through the authenticated client", async () => {
  const tab = createTab((config) => {
    if (config.url === "/orders") return ok(config, { orderCode: "TEST-ORDER", totalAmount: 100, status: "Pending", paymentUrl: null });
    if (config.url === "/cart/items") return ok(config, { items: [] });
    return standardAdapter(config);
  });
  await tab.session().signIn("member@example.test", "password");
  const payload = { addressId: "address-a", paymentMethod: "SePay", couponCode: "TEST", customerNote: "note" };
  const result = await tab.load("features/orders/api.ts").createOrder(payload);
  assert.equal(result.orderCode, "TEST-ORDER");
  assert.deepEqual(JSON.parse(tab.calls.find((call) => call.url === "/orders").data), payload);
  await tab.load("features/cart/api.ts").addCartItem("variant-a", 2);
  assert.deepEqual(JSON.parse(tab.calls.find((call) => call.url === "/cart/items").data), { productVariantId: "variant-a", quantity: 2 });
});

test("verification is single-flight even when React mounts the view twice", async () => {
  const tab = createTab(standardAdapter);
  const api = tab.load("features/auth/api.ts");
  await Promise.all([api.verifyEmail("one-time-proof"), api.verifyEmail("one-time-proof")]);
  assert.equal(tab.calls.filter((call) => call.url === "/auth/verify-email").length, 1);
});

test("cross-origin requests cannot receive a member Bearer token", async () => {
  const tab = createTab(standardAdapter);
  await tab.session().signIn("member@example.test", "password");
  const count = tab.calls.length;
  await assert.rejects(tab.client().get("https://untrusted.invalid/orders"), axios.isCancel);
  assert.equal(tab.calls.length, count);
});
