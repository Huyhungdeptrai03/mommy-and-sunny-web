import { test } from "node:test";
import assert from "node:assert/strict";
import { stagingOrigin, cookieAttributes } from "../scripts/Test-StagingReadiness.mjs";

test("staging smoke refuses missing isolation, HTTP and production-like targets", () => {
  for (const [value, verified] of [
    [undefined, true], ["https://staging.example.test", false], ["http://localhost:3000", true],
    ["https://shop.example.com", true], ["https://user:pass@staging.example.test", true],
    ["https://staging.example.test/api", true], ["https://staging.example.test/?token=x", true],
  ]) assert.throws(() => stagingOrigin(value, verified));
  assert.equal(stagingOrigin("https://staging.example.test", true), "https://staging.example.test");
});

test("cookie evidence contains attributes only and detects insecure cookies", () => {
  const flags = cookieAttributes("__Host-ms-csrf=not-a-real-secret; Path=/; Secure; HttpOnly; SameSite=Lax");
  assert.ok(Object.values(flags).every(Boolean));
  assert.ok(!JSON.stringify(flags).includes("not-a-real-secret"));
  assert.equal(cookieAttributes("__Host-ms-csrf=fixture; Path=/; Domain=example.test").hostOnly, false);
  assert.equal(cookieAttributes("__Host-ms-csrf=fixture; Path=/").httpOnly, false);
});
