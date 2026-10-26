# Báo cáo kiểm thử PostgreSQL và cổng phát hành staging

> Cập nhật deployment/Docker và migration rehearsal mới hơn nằm tại
> [STAGING_DEPLOYMENT_PREPARATION.md](STAGING_DEPLOYMENT_PREPARATION.md).
> Docker ignore/runtime image và rehearsal synthetic đã được kiểm tra trong bước
> đó; các nhận xét “chưa rehearsal/thiếu Docker ignore” bên dưới mô tả lần audit
> trước. Browser E01–E20 vẫn NOT RUN và Production vẫn NO-GO.

## Quyết định

**Production: NO-GO.** Đã hoàn thành PostgreSQL local thật, nhưng chưa có origin
staging HTTPS, cấu hình proxy/runtime, SMTP và tài khoản QA được xác nhận. Không
coi test local hoặc HTTP smoke là E2E staging đã đạt.

Không triển khai, commit, thay credential production, dùng database production,
khởi động backend bằng cấu hình ứng dụng hoặc thanh toán thật trong phiên này.

## 1. Kết quả đã xác minh

| Kiểm tra | Kết quả |
|---|---|
| Bốn PostgreSQL test trước đây skip | 4 đạt, 0 fail, 0 skip |
| Toàn bộ backend với DB test được cấp riêng | 66 đạt: 44 integration + 22 unit, 0 skip |
| Frontend regression và staging-runner guards | 40 đạt: 38 regression + 2 guards |
| TypeScript | Đạt |
| ESLint hai file JS mới | Đạt |
| Staging smoke thật | BLOCKED: chưa có origin/config staging được cung cấp |
| Browser E2E, SMTP, Google/Meta, payment thật | Chưa chạy |

Evidence mới nhất (không chứa connection string/password):

- `.next/qa/postgres-76e1797620734afa8e8da26019a16100/isolation.json`
- `.next/qa/postgres-76e1797620734afa8e8da26019a16100/postgres-auth.trx`
- `.next/qa/postgres-76e1797620734afa8e8da26019a16100/unit-tests.trx`
- `.next/qa/postgres-76e1797620734afa8e8da26019a16100/result.json`

`.next` là artifact tạm; giữ bản evidence đã kiểm tra trước build tiếp theo nếu
cần lưu hồ sơ release. Không lưu auth cookies/JWT/recovery links/raw HAR có secrets.

## 2. Database isolation và yêu cầu chính xác

Tests chỉ đọc `MOMMY_AUTH_TEST_POSTGRES`, không appsettings/compose/connection
string ứng dụng. Guard chỉ nhận host `127.0.0.1`, `localhost`, `::1`, database
bắt đầu `mommy_auth_test_`. Role cần CONNECT database, CREATE schema và quyền
DDL/DML trên schema mình tạo. Mỗi test tạo `auth_test_<32 hex>` rồi drop đúng schema.

Runner mới `scripts/Test-IsolatedPostgres.ps1` còn kiểm tra chặt hơn guard đó:

1. Docker context local named pipe, từ chối remote DOCKER_HOST/context.
2. Tạo container PostgreSQL 17 Alpine mới với tên/run label ngẫu nhiên.
3. Chỉ publish `127.0.0.1:<port ngẫu nhiên>:5432`; không host/named volume.
4. Data dùng tmpfs; password test sinh trong RAM, không có trong argv Docker hoặc file.
5. Kiểm tra ID/ownership label/port/mounts/database prefix và DB ban đầu 0 bảng.
6. Set connection string chỉ ở process/child test; pooling tắt, error detail tắt.
7. Sau test còn 0 schema auth_test; remove đúng container theo ID + label; khôi phục
   process environment trước đó. Không tác động container/database khác.

Docker Desktop đã được khởi động cho QA; image PostgreSQL được cache cục bộ.
Không tự dừng toàn bộ Docker engine vì có thể ảnh hưởng tài nguyên khác.

Chạy lại từ frontend bằng PowerShell:

```powershell
# Chỉ bốn test PostgreSQL
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Test-IsolatedPostgres.ps1 `
  -BackendRoot C:\Users\hungd\MommyAndSunny

# Toàn bộ backend, bao gồm bốn PostgreSQL tests
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Test-IsolatedPostgres.ps1 `
  -BackendRoot C:\Users\hungd\MommyAndSunny -Suite All
```

Nếu Docker đang tắt, operator có thể thêm `-StartDockerDesktop`. ExecutionPolicy
chỉ áp dụng process runner, không thay policy hệ thống. Runner không dùng DB hiện có.

## 3. Bốn PostgreSQL test

| Test | Bằng chứng |
|---|---|
| ParallelRefresh_OnlyOneSuccessor_Commits_AndFamilyIsRevoked | Một rotation thắng, một REFRESH_CONFLICT, đúng hai token tổng cộng, family revoked |
| ReplayAndLogout_InvalidatePreviouslyIssuedAccessToken | Replay bị từ chối; JWT principal cũ không hợp lệ; logout persisted; token không tạo successor |
| ConcurrentHandoffExchange_CreatesOnlyOneSession | Một exchange thắng, một conflict; chỉ một session được commit |
| UniqueExternalIdentity_AndUserConcurrency_AreEnforcedByPostgres | Composite uniqueness và user optimistic concurrency được DB thật thực thi |

Lần đầu thực chạy: 3 đạt, 1 fail ở post-logout expected SESSION_REVOKED nhưng nhận
REFRESH_CONFLICT. Nguyên nhân: test tái sử dụng tracked DbContext sau ExecuteUpdate;
EF không đồng bộ entity đang track. Production đăng ký DbContext/AuthService scoped
theo request. Test được sửa để request sau logout dùng context mới, **không đổi
expected error**, và bổ sung assert DB revoked, JWT principal bị từ chối, số token
không tăng. Không sửa AuthService hoặc logic revocation production.

Runner lần đầu cũng fail-closed khi Go-template quoting ownership label không hợp
lệ trên PowerShell. Đã đổi sang parse inspect JSON trong RAM, dọn container cũ sau
khi xác minh ID + label, rồi xác minh cleanup thành công ở cả targeted và full run.

## 4. Staging preflight tự động đã chuẩn bị

`scripts/Test-StagingReadiness.mjs` chưa được chạy với server thật. Khi thiếu origin
hoặc attestation, nó dừng BLOCKED trước mọi request. Guard chỉ cho HTTPS origin
QA/staging/loopback, không credential/path/query; không tắt TLS certificate checks.

Sau khi operator chứng minh staging DB/SMTP/payment cô lập:

```powershell
# URL không phải secret. Thay bằng origin staging thực đã được duyệt.
$env:MOMMY_AUTH_STAGING_ORIGIN = 'https://staging.example.test'
node scripts/Test-StagingReadiness.mjs --verified-isolated-staging
```

Runner chỉ kiểm tra unauthenticated HTTP: route/headers, CSRF cookie attributes,
private API trả 401, POST thiếu CSRF/Origin trả 403, refresh không member cookie trả
SESSION_EXPIRED, mock route Staging trả 404. Không register/login tài khoản thật,
không tạo order/payment, không theo redirect provider. Output không có cookie/token.
Tên host/flag là guard vận hành, **không tự chứng minh DB staging không trỏ production**.
Phải review runtime configuration và server identity trước khi xác nhận flag.

Chỉ với QA Development HTTPS/DB riêng có SePay mock được duyệt:

```powershell
node scripts/Test-StagingReadiness.mjs --verified-isolated-staging --development-mock
```

Mock hiện cố ý tắt trong ASPNETCORE_ENVIRONMENT=Staging/Production. Không đổi staging
sang Development để vượt guard. Dùng stack QA Development riêng cho payment mock.

## 5. Ma trận browser E2E cần thực hiện

Tất cả các dòng dưới đây **PREPARED / NOT RUN trên staging**. Dùng hai member QA,
một admin QA, mail capture/test inbox và sản phẩm/coupon QA, không dữ liệu khách thật.
Gắn run ID vào dữ liệu synthetic; test accounts phải được cấp qua kênh bảo mật.

| ID | Thao tác và kết quả bắt buộc |
|---|---|
| E01 | Đăng ký email QA, không tự login; mở email verify; xác minh một lần, replay bị từ chối |
| E02 | Login email/password đúng và sai; lỗi chung; user ID cũ giữ nguyên; không refresh token trong JSON |
| E03 | Quên/reset password qua test inbox; token hết hạn/replay bị từ chối; JWT và refresh session cũ bị thu hồi |
| E04 | Google app test users: start/cancel/callback/exchange; code bị consume một lần, không JWT trong URL/log |
| E05 | Facebook test users: email có/thiếu; onboarding cùng browser; lỗi/cancel; không tự merge email trùng |
| E06 | Link chủ động sau recent reauth; đúng CSRF principal, IDENTITY_CONFLICT không chuyển user; đơn cũ còn nguyên |
| E07 | Reload với cookie: JWT phục hồi RAM; key legacy bị xóa; local/session storage không có JWT/refresh token |
| E08 | Refresh cookie Secure/HttpOnly/Lax/Path=/, không Domain; JS document.cookie không đọc được refresh |
| E09 | Thiếu/sai Origin và CSRF, anonymous token dùng Bearer-link bị 403; không thực thi action |
| E10 | Ba tab bootstrap 6 request tổng, 3 rotation tuần tự; focus storm không duplicate; không token qua channel/storage |
| E11 | Inject 429/Retry-After/network/5xx trong test proxy: không anonymous vì lỗi tạm thời; không retry trước hạn |
| E12 | JWT expired/SESSION_REVOKED/REFRESH_CONFLICT: chặn API, không vòng lặp; refresh mất response không replay |
| E13 | Logout khi refresh pending: không restore user; các tab/cache/cart/wishlist/chat/Admin xóa; JWT server bị từ chối |
| E14 | Profile chỉ sửa name/phone; thử role/email/userId injection bị từ chối; address/history chỉ của user QA hiện tại |
| E15 | Member gọi admin API bị 403; anonymous 401; đổi role admin thu hồi session cũ, không chỉ ẩn UI |
| E16 | Cart/COD/coupon/pre-order trong QA DB: tổng/tồn kho server tính, pre-order không SePay; không guest checkout mới |
| E17 | SePay mock trên QA Development riêng: HTTPS placeholder, NO MONEY TRANSFER; webhook test đúng/sai/duplicate; không bank QR |
| E18 | Mất response order/payment: không tự retry, tra history theo mã đơn trước thao tác tiếp; không giao dịch trùng |
| E19 | History/detail/cancel giữ Users.Id ownership; user A không thấy/hủy đơn B |
| E20 | Reverse proxy HTTPS/callback/Set-Cookie/HSTS/public Host, invalid forwarded headers; không access Kestrel công khai |

Giữ bằng chứng PASS/FAIL theo case, thời gian, version artifact, browser và run ID.
Redact password/JWT/cookies/handoff/recovery query khỏi ảnh/log/HAR. Google/Meta và
SMTP thật không được coi là pass chỉ vì handler/controller test thành công.

## 6. Security và configuration findings

- Không có URL/config/tài khoản staging hoặc SMTP/provider credentials được cấp
  trong môi trường QA. Không cố dò/call production để thay thế.
- Cấu hình JSON local được kiểm tra dưới dạng boolean: chưa có HTTPS public origin,
  SMTP, Google/Meta credentials hoặc persistent Data Protection path. Đây là file
  defaults; chưa xác minh runtime staging overrides, không kết luận production dùng
  những giá trị đó. Startup fail-closed nếu thiếu cấu hình bắt buộc.
- Không tìm thấy cấu hình reverse proxy đang triển khai trong hai repo. Chưa chứng
  minh trusted proxy, TLS certificate, routing, cookie forwarding hoặc query redaction.
- SSR API URL phải đi qua public HTTPS origin, hoặc internal route được thiết kế
  để backend nhận đúng public Host/forwarded HTTPS từ proxy đáng tin cậy. Không
  giả mạo header từ browser hoặc tắt host/HTTPS validation.
- SePay mock chỉ Development. Staging/Production cần mock tắt; không gửi order hoặc
  tiền thật để kiểm thử. Mock amount/webhook tests không chứng minh ngân hàng thật.
- Quota theo IP còn cần load test NAT/multiple instances. Web Locks/HttpOnly chỉ
  được xác minh ở code/test transport; behavior trình duyệt/proxy thật còn E2E.
- Trước build Docker, bảo đảm context không chứa backup dump, .git hoặc secrets:
  Dockerfile backend đang COPY toàn context ở build stage, còn file backup chưa
  được đọc. Không đưa dump/config bí mật vào build cache/layer/registry.

## 7. Migration readiness

Đã review `20261026040155_HardenMemberAuthentication`: audit email trùng/rỗng trước
DDL; thêm AuthSessions/ExternalLogins/ExternalHandoffs và metadata refresh/user;
backfill normalized email/security UUID rồi unique index. Không đổi Users.Id hoặc
business FK. Auto migration/seed không chạy ở Production; Development cần opt-in.

**Giới hạn:** PostgreSQL tests tạo schema từ current model (GenerateCreateScript),
không chạy migration upgrade trên dữ liệu cũ. Offline SQL safety test đã pass,
nhưng chưa đo locks/downtime, đối chiếu Unicode collation/ToLowerInvariant, legacy
social users, duplicate email hay restore rehearsal trên snapshot đã ẩn danh.
Không được coi 4/4 pass là migration production đã được chứng minh an toàn.

Down migration drop các bảng auth mới. Không tự chạy rollback schema sau khi có
dữ liệu. Cần kế hoạch ứng dụng/schema rollback được review riêng.

## 8. Các bước thủ công trước triển khai

Các bước dưới là runbook, **chưa thực thi deploy/migration**. Chỉ operator được
ủy quyền thực hiện sau khi các gate E2E và migration rehearsal đạt. Không có tên
service/proxy runtime thật trong repo; không tự đoán lệnh restart service production.

1. Chốt version frontend/backend/contract; inventory client legacy; dựng staging
   độc lập, cấp DB/SMTP/test accounts/payment QA riêng và xác minh không trỏ production.
2. Chạy runner PostgreSQL `-Suite All`; chạy staging HTTP smoke và E01–E20, lưu
   bằng chứng. Hoàn thành migration rehearsal trên DB snapshot synthetic/ẩn danh
   được cấp riêng; backup/restore rehearsal và audit count email trước unique index.
3. Từ backend tạo SQL review offline (baseline theo contract; nếu history khác,
   operator phải đối chiếu trước):

   ```sh
   mkdir -p artifacts
   dotnet ef migrations script 20261022131113_AddChatProductTags 20261026040155_HardenMemberAuthentication \
     --idempotent --no-build \
     --project src/MommyAndSunny.Infrastructure \
     --startup-project src/MommyAndSunny.API \
     --output artifacts/member-auth-up.sql
   ```

   DesignTimeDbContextFactory dùng địa chỉ không kết nối được, không đọc deployment
   secrets. Review SQL, current migration history và backup trước mọi apply.
4. Operator áp dụng SQL **trên staging trước** bằng pg service/pgpass được bảo vệ,
   `psql -X -v ON_ERROR_STOP=1 -f artifacts/member-auth-up.sql`. Không đặt password
   trong argv/log. Apply production chỉ sau release approval riêng và maintenance
   plan; assistant/runner không thực hiện bước này.
5. Build artifact bằng đúng lockfile/SDK đã duyệt:

   ```sh
   # Backend
   dotnet publish src/MommyAndSunny.API/MommyAndSunny.API.csproj -c Release --no-restore -o artifacts/api
   # Frontend, từ repo frontend
   npm ci
   npm run build
   ```

   Kiểm tra Docker context trước build. Không đưa test credentials hoặc dump vào
   image. Provider flags là build-time, chỉ bật sau khi app test/provider callback sẵn sàng.
6. Cấp runtime secrets qua cơ chế hiện có: Frontend__BaseUrl HTTPS origin; DB đúng
   môi trường; JWT issuer/audience/secret; SMTP; provider credentials; persistent
   Data Protection key ring; KnownProxies. Database__ApplyMigrationsOnStartup=false.
   Production/Staging: SePay__UseMock=false. Không tái sử dụng test secrets.
7. Chuẩn bị reverse proxy bằng cơ chế VPS hiện có: `/api/*`, `/hubs/chat` tới C#;
   còn lại Next.js. Giữ public Host, ghi đè X-Forwarded-Proto/X-Forwarded-For bằng
   dữ liệu proxy tin cậy; chỉ proxy được tới Kestrel. Forward WebSocket upgrade,
   không strip cookie flags; no-store callback/auth/private API, redact query logs.
   Xác minh TLS/HSTS; không tắt certificate validation để làm test pass.
8. Phát hành frontend/backend đồng bộ theo maintenance/rollback plan đã duyệt;
   legacy sessions buộc đăng nhập lại. Không release một backend mới với frontend
   cũ còn refresh token JSON. Không tự chạy migration/seed lúc startup.
9. Sau deploy do operator thực hiện: kiểm tra health và các negative auth probes
   không tạo đơn; theo dõi 401/403/409/429/5xx, SMTP delivery và webhook failures.
   Không test live order/payment hoặc customer account production. Nếu fail, dừng
   release/rollback artifact tương thích theo plan; không chạy Down migration mù quáng.

## 9. File thay đổi trong phiên QA này

- Frontend `scripts/Test-IsolatedPostgres.ps1` (mới).
- Frontend `scripts/Test-StagingReadiness.mjs` (mới).
- Frontend `tests/release-readiness.test.mjs` (mới).
- Frontend `docs/STAGING_RELEASE_VALIDATION.md` (mới).
- Backend `tests/MommyAndSunny.IntegrationTests/PostgresMemberAuthTests.cs`:
  request-scope correction và assertions sau logout.

Không sửa logic authentication/payment production hoặc schema/migration ứng dụng.
