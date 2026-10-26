# Tích hợp Member Authentication — Frontend

## 1. Nguồn hợp đồng và phạm vi

Đã đọc toàn bộ `docs/MEMBER_AUTH_API_CONTRACT.md` do backend cung cấp. Backend là
ASP.NET Core 10 theo hợp đồng; source/backend/database chưa có trong workspace
frontend để xác minh độc lập. Không sửa hợp đồng backend, backend hoặc database.
Không cài dependency, không triển khai BFF/NextAuth/Firebase/Supabase Auth.

Một HTTPS origin: browser gọi `/api/*`; reverse proxy chuyển sang C#. `/auth/callback`
là trang Next.js. Chỉ C# phát hành/thu hồi phiên và quyết định ownership/role.

## 2. File frontend thay đổi

### Session và transport

- `store/authStore.ts`: chỉ user, status, generation, notice; bỏ persist và token.
- `types/auth.ts`: AuthResult theo contract, không refreshToken.
- `features/auth/session.ts`: JWT RAM, CSRF, refresh/login/logout, khóa liên tab,
  thông báo invalidation, profile revalidation, handoff exchange/onboarding.
- `features/auth/safety.ts`: allowlist query callback, safe internal destination,
  giới hạn mật khẩu BCrypt 72 byte UTF-8.
- `features/auth/retry.ts`: parse Retry-After seconds/HTTP-date.
- `features/checkout/payment-url.ts`, `features/checkout/components/CheckoutView.tsx`:
  giữ HTTPS-only payment navigation; không cho inline data URL, không replay tạo đơn.
- `lib/api-client.ts`: browser same-origin `/api`, Bearer, proactive refresh,
  giới hạn retry, stale-response cancellation; giữ envelope nghiệp vụ.
- `components/auth/AuthSessionProvider.tsx`, `app/layout.tsx`: bootstrap và vòng đời
  phiên, remount cây component khi danh tính thay đổi để bỏ state người cũ.

### UI và route

- `features/auth/api.ts`: login qua session, reset invalidation, resend verification,
  single-flight xác minh email tránh React Strict Mode consume token hai lần.
- `features/auth/components/LoginForm.tsx`: flow mới, safe returnTo, social buttons.
- `features/auth/components/RegisterForm.tsx`: social buttons và password byte limit.
- `features/auth/components/ForgotPasswordForm.tsx`: bắt rejection, phản hồi chung.
- `features/auth/components/ResetPasswordForm.tsx`: byte limit, scrub recovery query.
- `features/auth/components/VerifyEmailView.tsx`: scrub query, single-use-safe effect.
- `features/auth/components/SocialLoginButtons.tsx`: điều hướng provider, trạng thái
  chưa khả dụng, chỉ lưu đích nội bộ và link intent trong sessionStorage.
- `features/auth/components/ExternalAuthCallback.tsx`: one-time exchange, onboarding
  email, chủ động liên kết và thông báo lỗi.
- `app/auth/callback/page.tsx`: route riêng ngoài storefront; không chat/analytics.
- `next.config.ts`: callback/recovery no-referrer, no-store, noindex response headers.
- `features/account/api.ts`: GET/PATCH `/account/me`, allowlist payload hồ sơ.
- `features/account/components/AccountView.tsx`, `app/(storefront)/account/page.tsx`:
  hồ sơ, xác minh email, địa chỉ, order history, liên kết chủ động, logout.
- `components/layout/Header.tsx`, `app/admin/layout.tsx`: phiên thống nhất, server
  logout, chờ bootstrap, Admin UI guard giữ backend authorization làm authority.

### Kiểm thử/tài liệu

- `tests/auth-harness.mjs`: sandbox module, Axios adapter và tab/lock/channel giả lập.
- `tests/api-client.test.mjs`: kiểm thử auth/CSRF/OAuth/checkout/Admin.
- `tests/auth-resilience.test.mjs`: regression ba tab, 429/backoff, lỗi tạm thời,
  expired JWT và HTTPS QR contract.
- `docs/MEMBER_AUTH_FRONTEND_INTEGRATION.md`: tài liệu này.

Không sửa order/cart/checkout/payment/coupon/pre-order payload hoặc logic nghiệp vụ.
Không thay Users.Id hoặc quan hệ dữ liệu. Contract backend là file đầu vào do developer
cung cấp; không coi đó là frontend implementation đã tự tạo.

## 3. Session, CSRF và token

Access JWT chỉ ở biến module trong browser runtime, không ở Zustand, localStorage,
sessionStorage hoặc URL. Refresh token không được đọc từ JSON hoặc cookie bằng JS.
Backend quản lý `__Host-ms-refresh` HttpOnly/Secure/SameSite=Lax.

Bootstrap xóa key legacy `mommy-and-sunny-auth`, lấy CSRF anonymous rồi POST refresh
không body, không Authorization; dùng user trong AuthResult, không GET `/auth/me` lặp. Status có `checking`,
`authenticated`, `anonymous`. Trang private chờ kiểm tra phiên; catalog công khai vẫn
có SSR. Không đọc JWT browser từ Server Components và không forward cookie vào SSR.

CSRF anonymous được cache trong RAM và bỏ cache sau 403; cookie operations vẫn ở cùng khóa phiên. Login/refresh/logout,
exchange thường và external/email dùng anonymous CSRF. Link chủ động dùng CSRF GET
và exchange POST với cùng Bearer. Header chính xác `X-CSRF-TOKEN`; browser tự gửi
Origin. Không set Origin hoặc Referer giả.

Access token refresh chủ động khi còn dưới 30 giây qua request interceptor; kiểm tra
lại profile khi focus/visibility/pageshow và mỗi 60 giây nếu tab visible. Read
revalidation single-flight và debounce 60 giây từ lần xác thực thành công để tránh
focus storm; AuthResult sau refresh cũng là một lần xác thực mới.

## 4. Concurrency, logout và invalidation

- Một shared Promise refresh trong tab; mọi waiter nhận resolve/reject.
- Bootstrap một Promise mỗi page lifecycle; init lặp không gửi request mới.
- Ba tab bootstrap: trước 9 request, sau 6 (3 CSRF + 3 refresh tuần tự, không chia sẻ JWT).
  Sau 4 lượt kiểm tra theo phút: trước 21 và logout, sau 18 và vẫn authenticated.
  Refresh tiếp theo trong tab dùng CSRF cache: 1 POST thay vì GET + POST + GET me.
- Web Locks tên `mommy-and-sunny-auth-session` serialize refresh/login/logout/
  exchange/email giữa các tab. CSRF + operation ở cùng lock.
- Không gửi lại refresh sau 401/409 hoặc lỗi mạng. Backend strict conflict thu hồi
  session, không có grace. Tab chờ lock thực hiện refresh mới với cookie mới nhất.
- Timeout mỗi request auth 15 giây; chờ Web Lock tối đa 60 giây.
- Browser không hỗ trợ Web Locks hoặc không secure context: fail closed với thông
  báo, không dùng mutex localStorage hoặc gửi refresh không khóa.
- BroadcastChannel chỉ gửi `changed`/`logout`, tuyệt đối không gửi JWT/password/code.
  Các tab nhận đổi tài khoản clear state và khôi phục bằng refresh đã serialize.
- Generation làm request/refresh cũ không restore user hoặc cập nhật cache sau đổi
  phiên. Cart/wishlist store reset; cây UI remount xóa orders/address/chat/Admin
  local state. Callback và reset-password giữ state tạm để hoàn tất thao tác.
- Server logout luôn dùng anonymous CSRF. Local state được xóa ngay; nếu request
  thất bại, banner ghi rõ chưa xác nhận thu hồi trên server và có nút thử lại.
- 429/network/5xx không chuyển user hiện hữu thành anonymous hoặc broadcast logout.
  Tôn trọng Retry-After, đồng bộ backoff không chứa credentials giữa các tab.
  Bootstrap tạm lỗi giữ checking và cho kiểm tra lại/đăng nhập. Nếu refresh POST
  có thể đã commit nhưng mất response/5xx, giữ JWT còn hạn, chặn replay và yêu cầu
  đăng nhập lại. JWT hết hạn không được gửi làm fallback cho checkout.
- Backend tách credential/recovery, CSRF, refresh, read, logout, OAuth buckets.
  Login vẫn 20/5 phút/IP; sensitive vẫn 5/15 phút/IP. Refresh 40/5 phút/IP bao phủ
  3 tab ở TTL tối thiểu 1 phút và skew frontend 30 giây (tối đa 33 request).
  Auth/me 20/5 phút/UserId đã validate, không chung NAT với người khác.
- GET/HEAD/OPTIONS nhận 401 SESSION_EXPIRED retry tối đa một lần. 403 không refresh.
  SESSION_REVOKED xóa phiên. 401 đến muộn dùng JWT đã refresh thay vì rotate nữa.
- POST/PUT/PATCH/DELETE không tự phát lại, kể cả 401; network/timeout/5xx không retry.
  Mutation có thể báo lỗi khi token hết hạn đột ngột; người dùng cần kiểm tra kết
  quả trước khi thử lại, đặc biệt order/SePay.

Nếu BroadcastChannel không có, Web Locks vẫn ngăn race; tab khác có thể chỉ biết
revocation khi revalidation/focus/request kế tiếp. Chưa có fallback notification.

## 5. OAuth và liên kết

Nút Google/Facebook dùng `window.location.assign` đến GET start cùng origin;
không fetch/prefetch, không tạo challenge hoặc endpoint ngoài contract.

Callback chỉ chấp nhận `code`, `emailToken`, `error` và từ chối duplicate/unknown
parameters, gồm accessToken/refreshToken. Query được xóa khi client chạy. Backend
kiểm tra browser cookie binding/state/correlation, frontend không tự phát minh
transaction verifier hoặc tin email provider.

Automatic exchange được single-flight để không consume code hai lần dưới Strict
Mode. POST `/auth/external/exchange` body đúng `{code,emailVerificationToken?,
linkExistingAccount:false}`. Thành công lấy JWT vào RAM, refresh cookie do C# set.

- EMAIL_VERIFICATION_REQUIRED: UI thu email/họ tên và POST `/auth/external/email`;
  mở mail trên cùng browser trong thời hạn contract, exchange lại với emailToken.
- ACCOUNT_LINK_REQUIRED: không merge. Hiển thị xác nhận, cho dùng cookie phiên vừa
  đăng nhập trong 5 phút hoặc đăng nhập lại email/password rồi exchange với
  `linkExistingAccount:true` + đúng Bearer/CSRF. Backend kiểm tra recent authentication.
- Social-only target: đăng nhập provider của tài khoản đó, vào Account và bắt đầu
  link trong 5 phút; xác nhận bằng phiên vừa đăng nhập ở callback.
- INVALID_HANDOFF/IDENTITY_CONFLICT/REFRESH_CONFLICT: hiển thị lỗi, không tự tạo user.
- Handoff/email token chỉ ở RAM callback; không persist. Reload sau scrub cần bắt đầu
  lại (hoặc mở lại email nếu backend vẫn cho phép), không replay một cách mù quáng.

Đích quay lại chỉ lưu đường nội bộ đã kiểm tra trong sessionStorage; không chứa JWT,
refresh token hoặc handoff. Callback ngoài storefront, no-referrer/no-store/noindex;
không thêm analytics hoặc script bên thứ ba. Reverse proxy vẫn cần che query log
vì server nhận URL trước khi JavaScript có thể scrub.

## 6. Backend API dependencies

Dùng đúng contract dưới `/api`:

- GET `/auth/csrf`, POST `/auth/login`, `/auth/refresh-token`, `/auth/logout`;
  GET `/auth/me`.
- POST `/auth/register`, `/auth/verify-email`, `/auth/forgot-password`,
  `/auth/reset-password`, `/auth/resend-verification`.
- GET `/auth/external/{google|facebook}/start`; POST `/auth/external/exchange`,
  `/auth/external/email`.
- GET/PATCH `/account/me`.
- Giữ API address/order/cart/wishlist/review/Admin hiện có.

Không có API liệt kê provider đã liên kết, unlink, đổi email chính hoặc thêm password
cho social-only trong contract. UI không giả lập những khả năng đó.

Profile PATCH chỉ gửi fullName/phoneNumber; không gửi role/userId/tier/points.
Dùng lại AddressSelector và OrderList. Không tự thay ownership hoặc hạng thành viên.

## 7. Cấu hình cần chuẩn bị

### Frontend

Browser không còn dùng `NEXT_PUBLIC_API_URL`, luôn `/api`. Server-rendered public
catalog vẫn cần absolute API URL: ưu tiên `API_INTERNAL_URL`, fallback biến cũ
`NEXT_PUBLIC_API_URL`. Giá trị phải bao gồm `/api` đúng reverse proxy/backend; chỉ
lấy từ cấu hình tin cậy, không lấy origin từ Host header không xác minh.
Không thay env trong đợt này.

Không có endpoint provider discovery. Hai public build flags mặc định false:

- `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=true`
- `NEXT_PUBLIC_FACEBOOK_LOGIN_ENABLED=true`

Chỉ bật sau khi backend credentials/callback thực tế được xác nhận. Flag là cấu hình
UI, không phải secret và không chứng minh backend khả dụng. Nếu bật sai, start có
thể trả 503 PROVIDER_NOT_CONFIGURED ở backend; không có endpoint health/discovery
để frontend kiểm tra trước mà không khởi động OAuth. Không thêm API giả.

### Backend/operator

Theo contract: Frontend__BaseUrl đúng HTTPS origin; SMTP thật; JWT secret/issuer/
audience; provider secrets; Data Protection key ring bền vững; reverse proxy trust;
migration đã được review/applied bởi operator. Không chạy migration trong frontend.
OAuth redirect URI chính xác ở Google/Meta theo contract. Không log token/query.

Local cần HTTPS reverse proxy: `/api/*` đến C#, còn lại Next.js; HTTP localhost đơn
thuần không đủ vì cookie __Host/Secure và backend bắt buộc HTTPS/Origin. Khi dùng
`next dev --experimental-https`, vẫn cần proxy `/api` tới C#; dự án không thêm rewrite
hoặc cấu hình BFF để tự đoán port/backend origin.

## 8. Kiểm thử

Không thêm dependency. Chạy:

```powershell
node --test tests/api-client.test.mjs tests/auth-resilience.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
# ESLint trên các file mới/sửa (xem danh sách ở mục 2).
npm.cmd run build
```

38 test mô phỏng đạt sau bản sửa rate limit/mock: bootstrap/CSRF/cookie transport; token
không nằm trong store/storage; mọi waiter settle; logout/refresh race; hai tab
serialize và logout notification; 409 không retry; unsupported locks; login errors;
401 một retry/403 không retry; không replay checkout/payment; Admin revoke và UI
guards; cancel response cũ; callback allowlist/scrub; CSRF linking; handoff errors;
email onboarding; safe destination/password bytes; profile payload allowlist;
late 401; payload cart/SePay order; verification single-flight; chặn cross-origin.
Đây là giả lập Web Locks/BroadcastChannel/transport, không phải browser E2E.

TypeScript và ESLint file sửa đạt. Full-repository lint trước bản sửa còn lỗi tại
các component ngoài phạm vi; không được coi full-repo lint là đã đạt.
Production build đã đạt với quyền tải Google
Fonts hiện có; trong sandbox không mạng thì font fetch thất bại. Không đổi font.
HTTP smoke local production server: login/account/Admin/checkout/callback/recovery
trả 200; callback có no-store và no-referrer, recovery có các header tương ứng.
HTML private là shell chưa có dữ liệu user; 200 không có nghĩa quyền API đã được
kiểm thử. Không kết nối hoặc thay dữ liệu backend trong smoke test.

Không có Playwright/browser runner cài sẵn trong repository. Chưa test thực cookie
HttpOnly/Origin/CSRF, reload, multi-tab, SMTP, Google/Meta, checkout hoặc SePay webhook.
Không tuyên bố frontend unit pass chứng minh PostgreSQL concurrency/provider thật.

Backend sau sửa: 62 test đạt, 4 PostgreSQL test skip. Bao gồm middleware rate-limit
ASP.NET thật (không web host/DB), cached anonymous antiforgery vs Bearer principal,
QR URL HTTPS, placeholder non-payable và endpoint bị chặn ngoài Development mock.

SePay mock không còn data URL. Nó trả HTTPS public origin + `/api/payments/mock-qr`,
route ảnh chỉ bật khi Development và SePay:UseMock=true. SVG placeholder không có
QR ngân hàng, có CSP sandbox/nosniff/no-store và HTML encode orderCode. Production
gateway vẫn nguyên HTTPS image URL; số tiền, webhook và trạng thái đơn không đổi.

## 9. SignalR

Frontend hiện không có @microsoft/signalr/HubConnection/accessTokenFactory. Chat dùng
REST polling qua Axios; nhận cùng access token RAM và stale-response guard. Không
thêm SignalR hoặc transport query token. Nếu chuyển sang hub sau này: backend giữ
`/hubs/chat`, cần accessTokenFactory dùng session manager, reconnect sau refresh,
proxy redact access_token; không gửi refresh token. Việc đó ngoài thay đổi này.

## 10. Checklist trước production

- [ ] Backend deployed cùng phiên bản contract; migration/schema và legacy account
      audit hoàn tất; Users.Id và business FKs được giữ.
- [ ] Kiểm kê client cũ, coordinated cutover và buộc đăng nhập lại. Legacy storage
      bị xóa khi trang chạy; token JWT legacy không được backend chấp nhận.
- [ ] HTTPS một origin; `/api` routing, forwarded headers, cookie attributes và
      CSRF Origin/principal thật đúng. Không dùng cookie fallback HTTP.
- [ ] Kiểm tra DevTools Application/Network: không JWT trong local/session storage;
      refresh cookie HttpOnly không đọc được bằng JS; auth response không refreshToken.
- [ ] Đặt API_INTERNAL_URL hoặc giữ absolute public API URL cho SSR catalog.
- [ ] Kiểm thử reload, offline, session expiry/revocation, đa tab, logout lúc refresh,
      account switch, bfcache/focus, role Admin thay đổi.
- [ ] Provider app/SMTP thật sẵn sàng rồi bật build flags; test missing email,
      onboarding cùng browser, explicit link, expiry/replay/cancel/unavailable.
- [ ] Test profile/address/history; user A không thấy/sửa dữ liệu của B.
- [ ] Test COD/SePay/coupon/pre-order/cancel; mất response không tạo đơn/payment trùng.
- [ ] Proxy che query callback/email/reset, no-store/no-referrer; không analytics
      trên callback; backend logs không chứa token/password/recovery link.
- [ ] Xử lý lint còn tồn tại ở file ngoài phạm vi nếu release yêu cầu full-repo lint.
- [ ] Kiểm tra chức năng storefront/SEO SSR với backend thật và viewport mobile.

Không auto-commit, không deploy. Chỉ sẵn sàng đưa vào kiểm thử tích hợp staging;
chưa xác nhận production readiness khi còn các mục browser/backend thực chưa chạy.
