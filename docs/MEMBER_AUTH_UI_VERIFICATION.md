# Kiểm tra trải nghiệm đăng nhập và đăng ký

## Kết quả thực tế

Đã đọc LoginForm, RegisterForm, SocialLoginButtons, Header, AuthSessionProvider,
AccountView, callback, API wrappers, CSS và hợp đồng backend. Giữ thiết kế hiện tại
(logo Crab Be Bé, đỏ thương hiệu, Inter/Montserrat), kiến trúc JWT RAM/refresh cookie
và tất cả endpoint hiện hữu. Không sửa backend, database, môi trường hay deploy.

Trước thay đổi:

- Google/Facebook đã được render, không bị điều kiện ẩn. Cả hai disabled khi
  NEXT_PUBLIC_*_LOGIN_ENABLED khác chuỗi `true`, hoặc session đang checking.
- Hai flag local chưa được bật. Không thể kết luận giao diện VPS từ source local.
- Register thiếu xác nhận mật khẩu; thông báo xác minh chỉ có sau thành công và
  tự chuyển login sau 1,5 giây. Các label không liên kết input bằng id/htmlFor.
- Floating chat/Zalo/phone che ô xác nhận và hướng dẫn trên màn hình 320 px.

## Thay đổi giao diện

- Social luôn hiển thị: icon Google/Facebook, nhãn login/register/link phù hợp,
  trạng thái “Chưa khả dụng” và hướng dẫn dùng email. Không giảm opacity cả nút
  thành chữ khó đọc. Có focus indicator, vùng bấm >=48 px, trạng thái chuyển trang.
- Giữ điều hướng top-level cùng origin tới `/api/auth/external/google/start` và
  `/api/auth/external/facebook/start`. Chặn thao tác lặp khi đang gửi form/chuyển
  provider; không dùng fetch/prefetch để bắt đầu OAuth.
- Login: label liên kết đúng input; hiện/ẩn password; alert dễ đọc; loading rõ
  cả khi bootstrap; giữ forgot-password/register links qua Next Link.
- Register: xác nhận password, không gửi confirmation tới backend; chỉ gửi DTO cũ.
  Hiển thị chính sách password, hướng dẫn xác minh email kể cả social onboarding.
  Thành công giữ nguyên thông báo và nút tới login, xóa password trong RAM, khóa
  submit để tránh gửi đăng ký lại. Không còn redirect timer khó đọc.
- Giảm padding mobile, giữ khung hai cột desktop; không sửa bảng màu/font chung.
- Header: tên có giới hạn độ rộng; account menu có tên hỗ trợ accessibility,
  aria-expanded, link lịch sử đơn hàng; anonymous icon có accessible name ở mobile.
- Ẩn floating support chỉ trên login/register/forgot/reset/verify. Các trang
  storefront khác giữ các widget như trước.

## Kiểm thử

Đã chạy production standalone server tại `http://127.0.0.1:3100`, dùng Edge headless
thật qua CDP, profile QA riêng. Browser API requests được intercept và trả dữ liệu
synthetic. Đây là **browser UI với backend giả lập**, không phải E2E backend/provider
thật; không chứng minh HttpOnly cookie, CSRF, SMTP hoặc OAuth production hoạt động.

14 browser checks đạt:

1. Login desktop 1440 px: nút social nhìn thấy, disabled đúng, label và layout đúng.
2. Register desktop 1440 px: tương tự.
3. Login mobile 390 px: tương tự, không tràn ngang.
4. Register mobile 390 px: tương tự.
5. Login small mobile 320 px: tương tự.
6. Register small mobile 320 px: tương tự.
7. Password confirmation mismatch hiện lỗi và không gọi API.
8. Hiện/ẩn password thay đổi đúng type và trạng thái accessibility.
9. Register với response synthetic: đúng payload, thông báo giữ >1,5 giây, không
   auto-login/auto-redirect, chặn submit lặp.
10. Sai thông tin login hiển thị alert tiếng Việt từ code INVALID_CREDENTIALS.
11. Login response synthetic: chuyển account; Header hiện tên/menu; address và
    order synthetic xuất hiện đúng qua API wrappers hiện hữu.
12. Logout: Header anonymous, member profile/address/order cũ biến mất.
13. Callback từ chối accessToken trong URL và xóa query khỏi history.
14. Link tạo tài khoản, quay lại login và forgot-password điều hướng đúng.

Các kiểm tra khác:

- 40/40 regression mô phỏng hiện hữu đạt, gồm refresh/logout race, multi-tab,
  callback exchange/link/email, Admin guard, không replay checkout/payment.
- TypeScript đạt; ESLint tất cả file JS/TS sửa đạt; production build đạt.
- Build ban đầu trong sandbox không tải được Google Fonts; build lại có quyền
  mạng đạt, không đổi font. Một lần build bị profile Edge khóa file trong .next;
  đã đóng browser sở hữu, chuyển evidence/profile sang artifacts/member-ui và
  build lại đạt.
- Hai lần đầu test thao tác bị lỗi selector của harness (chọn search form Header);
  đã sửa selector thành main form. Bản cuối 14/14 đạt.

Evidence cuối:
`artifacts/member-ui/2026-10-26T07-48-46-965Z/result.json` và các screenshot cùng thư mục:

- login-desktop.png, register-desktop.png.
- login-mobile.png, register-mobile.png.
- login-small-mobile.png, register-small-mobile.png.
- register-success-mobile.png, login-error-mobile.png.
- account-mobile-synthetic.png.

Đã xem trực tiếp screenshot login desktop và register 320 px bản cuối: hai nút
social rõ ràng, form không bị contact/chat che. Footer hiện hữu có dòng email
liên hệ bị cắt ở 320 px; không redesign footer ngoài phạm vi auth. Các check layout
không thay thế screenshot review (nội dung bị clip có thể không tạo scrollWidth).

## Google và Facebook: trạng thái riêng

| Phương thức | Nút local | Start route source | Provider thật |
|---|---|---|---|
| Email | Có thể thao tác | Login/register giữ API hiện hữu | Chỉ browser response synthetic trong phiên này |
| Google | Nhìn thấy, Chưa khả dụng | `/api/auth/external/google/start` | Chưa thực hiện login Google thật |
| Facebook | Nhìn thấy, Chưa khả dụng | `/api/auth/external/facebook/start` | Chưa thực hiện login Facebook thật |

Callback hiện hữu giữ code một lần, browser binding do backend kiểm tra, exchange
qua POST, JWT vào session manager RAM, sau đó tới safe internal destination/account.
Source và regression mô phỏng đã kiểm tra flow; chưa có provider callback/session
server thật để xác nhận. Không dùng JWT URL, không tạo user hay giả danh provider.

Để kích hoạt từng nút, operator phải kiểm chứng trước:

1. Backend test credentials đúng provider: `Authentication__Google__ClientId` /
   `ClientSecret`, hoặc `Authentication__Facebook__AppId` / `AppSecret`.
2. Cùng HTTPS origin; callback provider đúng `/api/auth/external/google/callback`
   hoặc `/api/auth/external/facebook/callback`; SMTP test phục vụ email onboarding.
3. Chỉ sau khi xác minh cấu hình, build frontend với flag tương ứng bằng `true`:
   `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED`, `NEXT_PUBLIC_FACEBOOK_LOGIN_ENABLED`.
   Đây là build-time flags; đổi runtime env không tự sửa bundle đã build.
4. Chạy đăng nhập provider thật bằng test user, hoàn tất callback/exchange/email
   verification/link nếu cần, reload/logout và kiểm tra order ownership trước bật
   cho khách. Không tuyên bố pass chỉ vì nút enabled hoặc unit test đạt.

Không có endpoint provider discovery; frontend không tự xác minh credentials. Nếu
flag bật sai, backend có thể trả PROVIDER_NOT_CONFIGURED. Phiên này không bật flag,
không thay credentials và không sử dụng tài khoản khách hàng.

## File thay đổi trong phiên UI

- `.gitignore`: bỏ qua evidence/profile QA.
- `features/auth/components/LoginForm.tsx`.
- `features/auth/components/RegisterForm.tsx`.
- `features/auth/components/SocialLoginButtons.tsx`.
- `features/auth/components/PasswordInput.tsx` (mới).
- `components/layout/Header.tsx`.
- `components/auth/StorefrontSupportWidgets.tsx` (mới).
- `app/(storefront)/layout.tsx`.
- `scripts/Test-MemberUi.mjs` (mới, không thêm npm dependency).
- `docs/MEMBER_AUTH_UI_VERIFICATION.md` (tài liệu này).

Chạy lại UI harness: start production standalone server ở loopback 3100 với public
và .next/static đã copy theo hướng dẫn Next standalone; start Edge headless bằng
profile QA riêng, remote debugging loopback 9333; `node scripts/Test-MemberUi.mjs`.
Harness chặn browser API và external requests; không trỏ script tới production.
Đóng đúng browser/process QA sau test; không taskkill toàn bộ Edge/Node của máy.
