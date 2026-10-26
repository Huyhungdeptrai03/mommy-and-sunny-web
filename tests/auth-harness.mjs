import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import axios from "axios";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const compiled = new Map();
export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
export const tick = () => new Promise((resolve) => setImmediate(resolve));
export const user = (id = "a", role = "Customer") => ({ id, role, fullName: "Thành viên", email: "member@example.test", phoneNumber: null, emailVerified: true });
export function authResult(id = "a", role = "Customer") {
  return { accessToken: `${id}-access`, accessTokenExpiresAt: new Date(Date.now() + 900000).toISOString(), user: user(id, role) };
}
export function ok(config, data = null, status = 200) { return { config, data: { success: true, data, message: null }, status, headers: {} }; }
export function fail(config, status = 401, code = "SESSION_EXPIRED") {
  throw new axios.AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, {
    config, data: { success: false, code }, status, headers: {},
  });
}

export function browserGroup() {
  let tail = Promise.resolve();
  const channels = new Set();
  return {
    locks: { request(_name, _options, run) {
      const result = tail.then(run);
      tail = result.catch(() => undefined);
      return result;
    } },
    Channel: class {
      onmessage = null;
      constructor() { channels.add(this); }
      postMessage(data) {
        for (const channel of channels) if (channel !== this) queueMicrotask(() => channel.onmessage?.({ data }));
      }
    },
  };
}

export function createTab(adapter, { group = browserGroup(), pathname = "/login", search = "", locks = true, uiState, clock } = {}) {
  const cache = new Map();
  const calls = [];
  const removed = [];
  const writes = [];
  const storage = new Map();
  const window = {
    location: { pathname, search, assign() {} },
    history: { replaceState(_data, _unused, url) { window.location.search = ""; window.location.pathname = url; } },
    localStorage: { removeItem(key) { removed.push(key); }, setItem(key) { writes.push(key); } },
    dispatchEvent() {}, addEventListener() {}, removeEventListener() {},
  };
  const mockAxios = { ...axios, __esModule: true, create(config) {
    const client = axios.create(config);
    client.defaults.adapter = async (request) => { calls.push(request); return adapter(request); };
    return client;
  } };
  mockAxios.default = mockAxios;
  const context = vm.createContext({
    window, navigator: { locks: locks ? group.locks : undefined },
    BroadcastChannel: group.Channel, URL, URLSearchParams, TextEncoder, AbortSignal,
    Date: clock ? class extends Date { static now() { return clock.now; } } : Date,
    setTimeout, clearTimeout, console,
    sessionStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
    process: { env: {} },
  });
  function load(relative) {
    let file = path.resolve(root, relative);
    if (!path.extname(file)) file = [".ts", ".tsx"].map((extension) => file + extension).find(fs.existsSync);
    if (!file) throw new Error(`Missing module: ${relative}`);
    if (cache.has(file)) return cache.get(file).exports;
    const sandboxModule = { exports: {} };
    cache.set(file, sandboxModule);
    if (!compiled.has(file)) compiled.set(file, ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText);
    const localRequire = (name) => {
      if (name === "axios") return mockAxios;
      if (name === "next/navigation") return { useRouter: () => ({ replace() {}, push() {} }), usePathname: () => pathname };
      if (name === "next/link") return { __esModule: true, default: ({ children }) => children };
      if (name === "@/store/authStore" && uiState) return { useAuthStore: () => uiState };
      if (name.startsWith("@/")) return load(name.slice(2));
      if (name.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(file), name)));
      return require(name);
    };
    const execute = vm.runInContext(`(function(require,module,exports){${compiled.get(file)}\n})`, context);
    execute(localRequire, sandboxModule, sandboxModule.exports);
    return sandboxModule.exports;
  }
  return { load, calls, removed, writes, window, storage, group,
    session: () => load("features/auth/session.ts"), store: () => load("store/authStore.ts").useAuthStore,
    client: () => load("lib/api-client.ts").apiClient };
}

export function standardAdapter(config) {
  if (config.url === "/auth/csrf") return ok(config, { csrfToken: "csrf-request" });
  if (["/auth/login", "/auth/refresh-token", "/auth/external/exchange"].includes(config.url)) return ok(config, authResult());
  if (config.url === "/auth/me") return ok(config, user());
  return ok(config);
}
