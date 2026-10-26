// Retry-After supports delta-seconds and HTTP-date. No automatic mutation retry.
export function retryAfterTime(value: unknown, now = Date.now(), fallbackMs = 60000): number {
  const text = typeof value === "number" || typeof value === "string" ? String(value).trim() : "";
  if (/^\d+$/.test(text)) {
    const milliseconds = Number(text) * 1000;
    if (Number.isSafeInteger(milliseconds) && Number.isSafeInteger(now + milliseconds)) return now + milliseconds;
  }
  const date = /^[A-Za-z]{3}, /.test(text) ? Date.parse(text) : NaN;
  return Number.isFinite(date) ? Math.max(now, date) : now + fallbackMs;
}
