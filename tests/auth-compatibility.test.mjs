import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import axios from "axios";
import { createTab, standardAdapter, fail, ok, browserGroup, tick, deferred } from "./auth-harness.mjs";

function missing(config) { return fail(config, 404, "NOT_FOUND"); }
function anonymous(tab) {
  const state = tab.store().getState();
  assert.equal(state.status, "anonymous");
  assert.equal(state.isAuthenticated, false);
  assert.equal(state.user, null);
  assert.equal(state.notice, null);
  assert.equal(state.retryAt, null);
  assert.equal(state.sessionUnsupported, true);
}

test("old API: homepage bootstrap is quiet and public requests work even during initial detection", async () => {
  const tab = createTab(c => c.url.startsWith("/auth/") ? missing(c) : ok(c, { items: ["catalog"] }), { pathname: "/" });
  const [response] = await Promise.all([tab.client().get("/products"), tab.session().initializeSession()]);
  assert.equal(response.data.data.items[0], "catalog");
  anonymous(tab);
  assert.equal(tab.calls.filter(c => c.url === "/auth/csrf").length, 1);
  assert.equal(tab.calls.some(c => c.url === "/auth/refresh-token"), false);
  assert.equal(tab.calls.find(c => c.url === "/products").headers.get("Authorization"), undefined);
});

for (const endpoint of ["/auth/csrf", "/auth/refresh-token"]) {
  test(`missing ${endpoint}: focus, timers, forced refresh and broadcasts never cause retry loops`, async () => {
    const clock = { now: Date.now() }, group = browserGroup();
    const tab = createTab(c => c.url === endpoint ? missing(c) : standardAdapter(c), { clock, group });
    await tab.session().initializeSession();
    const count = tab.calls.length;
    clock.now += 3600000;
    await Promise.all(Array.from({ length: 20 }, () => tab.session().revalidateSession()));
    await tab.session().initializeSession();
    await assert.rejects(tab.session().refreshSession(), /AUTH_SESSION_UNSUPPORTED/);
    assert.equal(await tab.session().ensureAccessToken(true), null);
    const sender = new group.Channel();
    sender.postMessage({ type: "changed" });
    sender.postMessage({ type: "backoff", retryAt: clock.now + 60000, uncertain: true });
    await tick();
    anonymous(tab);
    assert.equal(tab.calls.length, count);
    if (endpoint === "/auth/refresh-token") {
      assert.equal(tab.calls.find(c => c.url === endpoint).method, "post");
      assert.equal(tab.calls.find(c => c.url === endpoint).headers.get("X-CSRF-TOKEN"), "csrf-request");
    }
  });
}

test("missing member endpoint clears a previously accepted identity and private caches", async () => {
  const clock = { now: Date.now() };
  const tab = createTab(c => c.url === "/auth/me" ? missing(c) : standardAdapter(c), { clock });
  await tab.session().signIn("member@example.test", "password");
  tab.load("store/cartStore.ts").useCartStore.getState().setItemCount(3);
  tab.load("store/wishlistStore.ts").useWishlistStore.getState().setProductIds(["private"]);
  clock.now += 60000;
  await tab.session().revalidateSession();
  anonymous(tab);
  assert.equal(await tab.session().ensureAccessToken(), null);
  assert.equal(tab.load("store/cartStore.ts").useCartStore.getState().itemCount, 0);
  assert.equal(tab.load("store/wishlistStore.ts").useWishlistStore.getState().productIds.size, 0);
  await tab.client().get("/products");
  assert.equal(tab.calls.at(-1).headers.get("Authorization"), undefined);
});

test("explicit sign-in explains unsupported auth without sending credentials or faking a user", async () => {
  const tab = createTab(missing);
  await tab.session().initializeSession();
  await assert.rejects(tab.session().signIn("member@example.test", "password"), error => {
    assert.match(tab.session().authErrorMessage(error), /chưa khả dụng/);
    return tab.session().authErrorCode(error) === "AUTH_SESSION_UNSUPPORTED";
  });
  anonymous(tab);
  assert.equal(tab.calls.some(c => c.url === "/auth/login"), false);
});

test("protected 401 remains rejected without refresh or replay under old API", async () => {
  const tab = createTab(c => c.url === "/auth/csrf" ? missing(c) : fail(c));
  await tab.session().initializeSession();
  await assert.rejects(tab.client().post("/orders", { paymentMethod: "COD" }));
  assert.equal(tab.calls.filter(c => c.url === "/orders").length, 1);
  assert.equal(tab.calls.at(-1).headers.get("Authorization"), undefined);
  anonymous(tab);
});

test("catalog 404 does not mark a supported session unsupported", async () => {
  const tab = createTab(c => c.url === "/products/missing" ? missing(c) : standardAdapter(c));
  await tab.session().initializeSession();
  await assert.rejects(tab.client().get("/products/missing"));
  assert.equal(tab.store().getState().sessionUnsupported, false);
  assert.equal(tab.store().getState().isAuthenticated, true);
});

test("new API preserves CSRF POST refresh, bearer auth, member validation and recovery after a reload", async () => {
  const oldTab = createTab(missing);
  await oldTab.session().initializeSession();
  const clock = { now: Date.now() }, tab = createTab(standardAdapter, { clock });
  await tab.session().initializeSession();
  assert.equal(tab.store().getState().sessionUnsupported, false);
  assert.equal(tab.store().getState().isAuthenticated, true);
  const refresh = tab.calls.find(c => c.url === "/auth/refresh-token");
  assert.equal(refresh.method, "post");
  assert.equal(refresh.headers.get("X-CSRF-TOKEN"), "csrf-request");
  await tab.client().get("/cart");
  assert.equal(tab.calls.at(-1).headers.get("Authorization"), "Bearer a-access");
  clock.now += 60000;
  await tab.session().revalidateSession();
  assert.equal(tab.calls.at(-1).url, "/auth/me");
  assert.equal(tab.store().getState().isAuthenticated, true);
});

test("late private response is rejected after a missing member endpoint clears identity", async () => {
  const pending = deferred(), clock = { now: Date.now() };
  let privateConfig;
  const tab = createTab(c => {
    if (c.url === "/orders") { privateConfig = c; return pending.promise; }
    return c.url === "/auth/me" ? missing(c) : standardAdapter(c);
  }, { clock });
  await tab.session().initializeSession();
  const request = assert.rejects(tab.client().get("/orders"), axios.isCancel);
  await tick();
  clock.now += 60000;
  await tab.session().revalidateSession();
  pending.resolve(ok(privateConfig, { private: "must not render" }));
  await request;
  anonymous(tab);
});

for (const pathname of ["/", "/products", "/search", "/cart", "/checkout", "/account", "/orders", "/admin/dashboard"]) {
  test(`unsupported provider on ${pathname} renders public content or an explicit private-feature error`, () => {
    const tab = createTab(standardAdapter, { pathname, uiState: {
      status: "anonymous", sessionUnsupported: true, user: null, isAuthenticated: false,
      notice: null, retryAt: null, recoveryRequiresLogin: false, generation: 1,
    } });
    const Provider = tab.load("components/auth/AuthSessionProvider.tsx").default;
    const html = renderToStaticMarkup(React.createElement(Provider, null, "PAGE_CONTENT"));
    const privatePage = ["/cart", "/checkout", "/account", "/orders", "/admin/dashboard"].includes(pathname);
    assert.equal(html.includes("PAGE_CONTENT"), !privatePage);
    assert.equal(html.includes('role="alert"'), privatePage);
    assert.equal(html.includes('role="status"'), false);
    assert.equal(html.includes("Đang kiểm tra"), false);
  });
}
