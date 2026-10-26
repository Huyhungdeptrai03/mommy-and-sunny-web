# Sửa bootstrap rate limit và SePay mock

## Kết quả và giới hạn

Đã tái hiện lỗi trước sửa: ba tab bootstrap 9 request; sau bốn lượt read check,
request thứ 21 vượt bucket auth 20/5 phút, tất cả tab thành anonymous.
Sau sửa: bootstrap 6 request, sau bốn lượt là 18 và ba tab vẫn authenticated.
Đây là test frontend mô phỏng; rate-limit backend được kiểm tra riêng bằng
middleware ASP.NET thật, không khởi động web host/database production.

Frontend 38/38 test đạt; TypeScript, ESLint file thay đổi và production build đạt.
Backend 62 test đạt (22 unit + 40 integration), 4 PostgreSQL test skip vì chưa có
database test cô lập. Không chạy migration, thay credentials hoặc thanh toán thật.

## Nguyên nhân

- Bootstrap đã single-flight trong tab và có Web Locks liên tab; lỗi không phải
  do thiếu hai cơ chế đó. Refresh trả user rồi lại GET auth/me là read trùng.
- Focus/visibility/polling không debounce/in-flight read nên tiêu thụ quota thêm.
- Backend gom CSRF, refresh, auth/me vào cùng quota credential theo IP.
- Frontend coi mọi refresh/revalidation error là mất phiên, kể cả 429/5xx/network.
- Production SePay trả HTTPS QR image URL; mock trả data:image/svg+xml trong khi
  checkout chỉ cho HTTPS navigation. Không có căn cứ mở rộng ứng dụng cho data URL.

## Session thay đổi

Giữ JWT module RAM, refresh cookie HttpOnly, backend authorization và Web Locks.
Không broadcast JWT hoặc persist credential. Mỗi tab cần một rotation riêng để
nhận JWT vào RAM; ba tab có ba POST tuần tự, không cố chia sẻ JWT giữa các tab.

- Một init Promise/page lifecycle; init lặp không tạo request mới.
- Dùng user trong AuthResult, bỏ GET auth/me ngay sau rotation.
- Cache anonymous CSRF trong RAM; cache không áp dụng Bearer-link. Xóa sau 403,
  không replay POST. Backend antiforgery test chứng minh token anonymous không
  được chấp nhận trong principal Bearer và token Bearer mới vẫn hợp lệ.
- Read revalidation single-flight/debounce 60 giây, gồm focus/visibility/pageshow.
- 429: parse Retry-After seconds/HTTP-date, chia sẻ backoff metadata giữa tab,
  không gửi lại trước hạn, không logout hoặc thay generation.
- Network/5xx: giữ danh tính/JWT còn hạn. CSRF GET thất bại có thể thử sau backoff.
  Refresh POST mất response hoặc 5xx có thể đã commit nên chặn replay và yêu cầu
  đăng nhập lại. Không gửi JWT hết hạn cho checkout, không tự tạo lại order/payment.
- Chỉ 401 SESSION_EXPIRED/SESSION_REVOKED và 409 REFRESH_CONFLICT xác nhận phiên
  không hợp lệ. Logout chủ động vẫn xóa local state ngay và gọi thu hồi server.

## Rate limits trước/sau

| Policy | Trước | Sau |
|---|---|---|
| Login / verify-email | 20/5 phút/IP, chung session traffic | 20/5 phút/IP, bucket credential riêng |
| Register / forgot / reset / resend | 5/15 phút/IP | Giữ 5/15 phút/IP |
| CSRF | Chung credential | 20/5 phút/IP riêng |
| Refresh | Chung credential | 40/5 phút/IP riêng |
| Auth/me | Chung credential/IP | 20/5 phút/UserId đã validate; anonymous fallback IP |
| Logout | Chung credential | 20/5 phút/IP riêng |
| OAuth start | Chung sensitive 5/15 phút/IP với nhiều bước | 5/15 phút/IP riêng |
| OAuth complete/exchange | Chung sensitive | 20/5 phút/IP riêng |
| OAuth onboarding mail | Chung sensitive | 5/15 phút/IP riêng |

40 refresh/5 phút được tính từ workload hỗ trợ: 3 bootstrap + 3 tab × 10 rotations
(TTL tối thiểu 60 giây, renew sớm 30 giây) = 33. Giới hạn vẫn dựa IP, không key
theo cookie thay đổi mỗi rotation để tránh bypass. Không bỏ limiter hoặc tăng
quota password attempts. Retry-After lấy metadata lease khi có, fallback 60 giây.
NAT lớn vẫn cần load test và capacity tuning có review.

## SePay

Mock trả `https://<public-origin>/api/payments/mock-qr?orderCode=...&amount=...`.
Endpoint chỉ trả ảnh khi Development và SePay:UseMock=true; Production/Staging
hoặc mock tắt trả 404. Ảnh là placeholder NO MONEY TRANSFER, không QR ngân hàng;
escape mã đơn, sandbox CSP, nosniff và no-store. Frontend vẫn chỉ cho HTTPS,
không data/javascript/http/userinfo. Production gateway, DTO, tiền, chữ ký,
webhook và order status không thay đổi.

## File thay đổi trong đợt sửa này

Frontend (`C:/Users/hungd/mommy-and-sunny-web`):

- `features/auth/session.ts`
- `features/auth/retry.ts` (mới)
- `store/authStore.ts`
- `components/auth/AuthSessionProvider.tsx`
- `features/auth/components/LoginForm.tsx`
- `features/auth/components/SocialLoginButtons.tsx`
- `features/checkout/payment-url.ts` (mới)
- `features/checkout/components/CheckoutView.tsx`
- `tests/auth-harness.mjs`
- `tests/api-client.test.mjs`
- `tests/auth-resilience.test.mjs` (mới)
- `docs/MEMBER_AUTH_API_CONTRACT.md`
- `docs/MEMBER_AUTH_FRONTEND_INTEGRATION.md`
- `docs/AUTH_RESILIENCE_AND_SEPAY_FIX.md` (mới)

Backend (`C:/Users/hungd/MommyAndSunny`):

- `src/MommyAndSunny.API/Program.cs`
- `src/MommyAndSunny.API/Services/MemberAuthRateLimits.cs` (mới)
- `src/MommyAndSunny.API/Controllers/AuthController.cs`
- `src/MommyAndSunny.API/Controllers/ExternalAuthController.cs`
- `src/MommyAndSunny.API/Controllers/MockPaymentsController.cs` (mới)
- `src/MommyAndSunny.Infrastructure/ExternalServices/MockSePayPaymentGateway.cs`
- `tests/MommyAndSunny.UnitTests/MockSePayPaymentGatewayTests.cs`
- `tests/MommyAndSunny.IntegrationTests/MemberAuthRateLimitTests.cs` (mới)
- `tests/MommyAndSunny.IntegrationTests/MockPaymentImageTests.cs` (mới)
- `tests/MommyAndSunny.IntegrationTests/AnonymousCsrfReuseTests.cs` (mới)
- `docs/MEMBER_AUTH_API_CONTRACT.md` (đồng bộ cùng bản frontend)

## Test commands

```powershell
# Frontend
node --test tests/api-client.test.mjs tests/auth-resilience.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
# ESLint các source/test trong danh sách thay đổi trên.
npm.cmd run build

# Backend (không web host, không DB ứng dụng)
dotnet test MommyAndSunny.slnx --no-restore --logger "console;verbosity=minimal"
```

## Trước production

- Chạy bốn PostgreSQL tests trên database loopback tên mommy_auth_test_* được cấp
  riêng; không dùng connection string ứng dụng/production.
- Chạy browser E2E cùng HTTPS origin: ba tab, đổi focus, expiry, 429, offline,
  logout trong refresh, CSRF principal và retry sau mất response.
- Kiểm tra reverse proxy routing `/api/payments/mock-qr` trong Development HTTPS;
  Production phải trả 404 cho route mock. Không bật mock ở Production.
- Kiểm tra Google/Meta/SMTP và payment sandbox; không gửi đơn hoặc tiền thật.
- Xác minh SSR catalog/public Host theo audit trước và load test NAT/proxy.

Hai lỗi đã được sửa và xác minh ở phạm vi test trên; chưa xác nhận production
readiness khi chưa có E2E HTTPS thật và PostgreSQL concurrency tests.
