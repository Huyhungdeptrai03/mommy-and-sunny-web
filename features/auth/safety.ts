export function safeDestination(value: string | null | undefined, fallback = "/account"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") ||
      /[\\\u0000-\u0020\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://internal.invalid");
    if (url.origin !== "https://internal.invalid" ||
        /^\/(?:api|auth)(?:\/|$)/i.test(url.pathname) ||
        /%(?:2f|5c|00|0a|0d)/i.test(value)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}

export interface OAuthCallback { code?: string; emailToken?: string; error?: string; }

export function parseOAuthCallback(search: string): OAuthCallback {
  const params = new URLSearchParams(search);
  const allowed = new Set(["code", "emailToken", "error"]);
  if ([...params.keys()].some((key) => !allowed.has(key) || params.getAll(key).length !== 1)) {
    return { error: "INVALID_HANDOFF" };
  }
  if (params.has("error")) return { error: "OAUTH_FAILED" };
  const code = params.get("code");
  const emailToken = params.get("emailToken");
  if (!code || code.length > 2048 || (emailToken !== null && (!emailToken || emailToken.length > 4096))) {
    return { error: "INVALID_HANDOFF" };
  }
  return { code, ...(emailToken ? { emailToken } : {}) };
}

export function validMemberPassword(value: string): boolean {
  return [...value].length >= 8 && new TextEncoder().encode(value).length <= 72;
}
