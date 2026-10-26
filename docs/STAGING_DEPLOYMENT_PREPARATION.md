# Chuẩn bị staging và đánh giá phát hành

**Quyết định: Production NO-GO.** Đã kiểm tra local Docker/DB synthetic; chưa có
origin, TLS, SMTP, Google/Meta test apps hoặc tài khoản staging được xác nhận.
Không dựng stack staging, deploy, chạy migration production, đọc backup khách hàng,
gửi tiền hay tạo đơn live. E01–E20 trong STAGING_RELEASE_VALIDATION.md vẫn NOT RUN.

## 1. Audit và các thay đổi

Cả hai repository đều truy cập được: frontend `mommy-and-sunny-web`, backend
`MommyAndSunny`. Đã đối chiếu contract và tài liệu tích hợp trước thay đổi.

| Hạng mục | Kết quả |
|---|---|
| Frontend | Next.js 16.2.11, React 19.2.4, npm lockfile; thêm standalone theo guide cài cùng Next |
| Backend | ASP.NET Core 10; publish API project, giữ EF migration hiện hữu |
| Docker backend trước sửa | COPY toàn context, thiếu ignore, có file dump tại repo; không đọc nội dung dump |
| Docker sau sửa | Multi-stage, runtime non-root; không copy appsettings, env, dump, Git, artifacts; config qua runtime |
| Compose cũ backend | Chỉ database, tên/volume cố định; không dùng vì chưa chứng minh là dữ liệu test |
| Reverse proxy triển khai | Không có runtime config được cấp; template mới chưa thay proxy thật |
| Authentication | Giữ JWT RAM + HttpOnly cookie, backend authority; không sửa auth/payment logic |
| SMTP | SmtpEmailSender dùng STARTTLS (EnableSsl=true); SMTP plain/implicit TLS không tương thích |
| SePay | Production trả HTTPS VietQR URL; mock chỉ Development, ảnh không thể chuyển tiền |

File của phiên này (không liệt kê lại các thay đổi auth từ phiên trước):

- Frontend `.dockerignore`, `Dockerfile`, `next.config.ts`.
- Backend `.dockerignore`, `Dockerfile`.
- `deployment/staging/.gitignore`, `staging.env.example`, `api.env.example`,
  `postgres.env.example`, `compose.yaml`, `compose.qa-mock.yaml`, `nginx.conf.template`.
- `scripts/Test-DockerContext.ps1`, `Test-DockerImage.ps1`, `list-image-files.py`,
  `Test-StagingTemplates.ps1`, `Test-MigrationRehearsal.ps1`.
- `scripts/Test-IsolatedPostgres.ps1`: thêm suite Migration, giữ guard/cleanup hiện hữu.
- Tài liệu này và cập nhật tham chiếu trong `STAGING_RELEASE_VALIDATION.md`.

Không sửa controller/service/entity/migration ứng dụng, backend contract hoặc payment DTO.

## 2. Kiểm thử đã thực hiện

| Kiểm thử | Kết quả thực chạy |
|---|---|
| Build Docker frontend | Đạt; chạy npm ci và Next production build trong image Linux |
| Build Docker backend | Đạt; restore/publish Release trong image .NET 10 |
| Docker context web | Đạt: 11 canary bị loại, 5 build inputs được giữ |
| Docker context API | Đạt: 15 canary bị loại, 5 build inputs được giữ |
| Runtime image export | Cả hai đạt: non-root, 0 file bị cấm dưới /app, 0 credential env keys kiểm tra |
| Compose staging + QA mock | Render/config validation đạt, private services không publish port |
| nginx -t | Đạt trong container network=none, cert synthetic; không chạy server listen |
| Frontend regression | 40/40 đạt, 0 skip; transport/locks/browser APIs mô phỏng |
| TypeScript / ESLint next.config.ts | Đạt |
| Backend | 44 integration + 22 unit = 66 đạt, 0 skip; PostgreSQL thật cô lập |
| Migration upgrade + restore | Đạt trên baseline SQL và dữ liệu synthetic, xem mục 4 |
| Staging HTTP smoke / browser E2E | BLOCKED / NOT RUN, không có staging được xác nhận |

Runtime images đã kiểm tra (local, không push registry):

- `mommy-qa-api:qa-mvovvvti`, image ID
  `sha256:e1573b7fabafa42cbf247633b92a76938f2981fa03d0f17731d21662ca7572d5`.
- `mommy-qa-web:qa-mvovvvti`, image ID
  `sha256:9d2c3159dc658528be1bf8d3d74433671ca0970924eb5e363bc5e9cbb1f6cd8b`.

Build context canary là fixture tổng hợp dùng chính `.dockerignore`, không copy
secret/backup thật để thử. Runtime export kiểm tra đường dẫn file và các env keys
credential đã định nghĩa, không phải cam kết đã quét mọi literal secret trong binary.
Image build không nhận secret build args. Không khởi động hai application images.
Base image tags còn mutable: trước release phải chọn digest được duyệt và lưu
build provenance/SBOM/vulnerability scan; deploy đúng digest đã test, không rebuild
âm thầm theo tag. Chưa chạy CVE scanner, chưa chứng minh runtime toàn stack.

Evidence local nằm dưới `.next/qa` (tạm, cần lưu bản đã scrub trước build/cleanup):

- `context-fa35287054654d2faa035558b3396136/result.json` (web).
- `context-eb01ac19a813431da6ab696b5ab301d5/result.json` (api).
- `image-3c3f2fdac51d475d8eec58e353f28a31/result.json` (api).
- `image-fd32490e38e54aa89d1eb75eae724d1d/result.json` (web).
- `compose-8ff4a111ee4b4d4187ee4679ff97451c/result.json` (Compose và nginx).
- `postgres-d476caabadae4bec8b0012a984c8cb55`: isolation.json, hai TRX, result.json.
- `postgres-4a6a4ba9db834306a53808f56d31d553/migration-result.json`, baseline.sql,
  up.sql, synthetic-before.dump, lock.out/lock.err. Chỉ dump synthetic được tạo.
  Upgrade fixture đo được 258 ms (gồm overhead runner), không phải downtime thực.

Container PostgreSQL, image-inspection và nginx QA đã cleanup theo ownership;
image/cache và artifacts local được giữ, không prune tài nguyên Docker khác.

## 3. Cách hoàn thiện môi trường staging

Các file là **template**, không phải môi trường đã hoạt động. Không có domain hoặc
credential được tự đoán. Operator phải cấp các giá trị trống, không dùng production.

1. Chọn project có tên staging/qa riêng, subnet private không xung đột, proxy IP
   trong subnet, host staging thực và origin `https://<host>` mặc định port 443.
   Template này không hỗ trợ public non-default port; không chỉ đổi host port.
2. Chọn image API/web đã review. Pin PostgreSQL/nginx và app images bằng digest
   trong `staging.env`; pin base images khi tạo release artifact. Chưa xác nhận
   PostgreSQL major/collation production; local tests dùng 17 Alpine, compose cũ
   có tag 16. Cần rehearsal lại đúng version/collation đích trước production.
3. Copy `.example` thành `staging.env`, `secrets/api.env`, `secrets/postgres.env`;
   tạo thư mục secrets ngoài version control. `chmod 700 secrets`, `chmod 600`
   các env/private key trên VPS. Không chạy `compose config` có output đầy đủ
   vào log chia sẻ; dùng `config --quiet`. Docker administrator vẫn đọc được env.
4. DB chỉ service `postgres`, không host port, volume project mới, không external
   volume, không mount DB hiện hữu. Xác minh project/volume chưa từng chứa dữ liệu
   khách hàng. Role POSTGRES_USER chỉ dùng provision/migration; tạo role runtime
   riêng không superuser/DDL, cấp CONNECT/USAGE và SELECT/INSERT/UPDATE/DELETE trên
   bảng cần thiết sau migration. ConnectionStrings__DefaultConnection dùng
   `Host=postgres;Port=5432;Database=mommy_auth_staging;Username=<QA app role>;...`.
   Không dùng role bootstrap `mommy_staging_admin` cho API.
5. JWT secret ngẫu nhiên riêng >=32 ký tự, issuer/audience riêng; không dùng secret
   mẫu hoặc production. Giữ startup migrations=false; không auto-seed.
6. Cấp TLS chain/key cho đúng STAGING_HOST tại secrets/tls.crt và secrets/tls.key.
   Template proxy chỉ bind loopback:443; dùng tunnel/DNS mapping đã duyệt, hoặc
   operator review ingress/firewall riêng trước khi expose staging có kiểm soát.
   Không dùng certificate fixture `.invalid` để triển khai. Nếu private CA: phải
   cài trust đúng cho browser, Node SSR và API/SMTP, không tắt TLS validation.
7. Alias host staging trong network trỏ proxy, nên SSR API_INTERNAL_URL đi cùng
   HTTPS public origin và Host chính xác; không gọi Kestrel HTTP rồi giả headers.
   Chỉ IP proxy cấu hình được trust; API/web/DB không có published ports.
   nginx ghi đè forwarded headers, forward WebSocket và không cache API.
8. SMTP dùng test inbox/capture riêng hỗ trợ STARTTLS với chain tin cậy; không
   relay đến khách hàng. Tạo sender/test credentials riêng. Mailpit mặc định plain
   không đủ; cần STARTTLS và CA trust nếu chọn Mailpit. Template không tự cấp SMTP.
9. Google/Meta app test riêng, chỉ allow test users. Redirect URI chính xác:
   `<STAGING_ORIGIN>/api/auth/external/google/callback` và
   `<STAGING_ORIGIN>/api/auth/external/facebook/callback`. Không dùng Next callback
   làm URI provider. Backend redirect handoff tới `/auth/callback`. Chỉ bật public
   build flags sau cấu hình provider thật; flags không phải secrets.
10. Staging base: UseMock=false; chưa có bằng chứng SePay sandbox chính thức được
    cấp cho dự án. Không dùng bank account/webhook production hoặc bịa credentials
    để vượt startup. Nếu thiếu test account an toàn, đánh dấu payment staging blocked.
    Để E17 mock: dựng **project QA Development khác**, origin/subnet/volumes/JWT/
    credentials khác và thêm compose.qa-mock.yaml. Không override stack staging
    đang chạy thành Development. Không public webhook test như production.
11. Data Protection keys và uploads ở volume riêng, bảo vệ quyền/backup/encryption
    trên VPS. Persistence chưa đồng nghĩa encryption-at-rest; phải review cơ chế
    bảo vệ key ring trước production. Không chia sẻ keys giữa QA và production.

Không thêm BFF, hệ thống auth, database danh tính hoặc dependency ứng dụng mới.

## 4. Migration rehearsal

Runner tạo PostgreSQL 17 Alpine mới, port loopback ngẫu nhiên, dữ liệu tmpfs,
password sinh trong process; kiểm tra DB rỗng, ID/ownership/mounts rồi mới dùng.
Không đọc appsettings/compose/.env/backup hiện hữu. Cuối run bỏ đúng container đó.

Rehearsal thực hiện:

1. Sinh SQL offline từ EF design-time factory (port 1 không kết nối được).
2. Apply toàn lịch sử đến `20261022131113_AddChatProductTags` vào DB rỗng.
3. Seed một user local, order COD, cart và address synthetic với UUID cố định.
4. Dump custom format baseline, ghi checksum dữ liệu business và định nghĩa FK.
5. Giữ AccessShareLock ở connection khác; apply upgrade với lock_timeout=500ms:
   bị chặn như dự kiến, transaction rollback, không NormalizedEmail dở dang.
6. Bỏ lock rồi apply `20261026040155_HardenMemberAuthentication`: giữ UUID,
   business rows và định nghĩa FK; backfill normalized email/security UUID; tạo
   auth tables/unique indexes. Duplicate normalized email bị index từ chối.
7. Hai DB synthetic khác: legacy duplicate email sau trim/lower và email trắng
   làm guard abort trước DDL; không tự merge user.
8. Restore baseline dump vào DB mới khác: business checksum/FKs khớp, history
   không có target migration. Ghi SHA-256 dump trong migration-result.json.

Đã quan sát upgrade fixture nhỏ mất khoảng vài trăm ms qua runner; đây **không phải**
dự báo downtime production. DDL/UPDATE/index có thể giữ AccessExclusiveLock, chờ
transactions đang mở và chặn ghi/đọc trên dữ liệu lớn. Rehearsal không bao phủ dung
lượng thực, disk/WAL, Unicode collation/ToLowerInvariant hoặc legacy social identities.
Không đọc real backup để thay thế. Trước production cần dataset synthetic đại diện
về quy mô/phân bố và version/collation đích, audit email/legacy identity có phê duyệt.
Không tự sửa/merge các account xung đột. Down migration drop auth tables nên không
được dùng như rollback mặc định; phương án đã thử là restore baseline vào DB mới.

Lệnh chạy lại local (không deploy):

```powershell
# Build backend trước khi dùng EF --no-build; không khởi động web host.
dotnet build C:\Users\hungd\MommyAndSunny\src\MommyAndSunny.API\MommyAndSunny.API.csproj --no-restore
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Test-IsolatedPostgres.ps1 -Suite Migration
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Test-IsolatedPostgres.ps1 -Suite All
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Test-StagingTemplates.ps1 -CheckNginx
node --test tests/api-client.test.mjs tests/auth-resilience.test.mjs tests/release-readiness.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js next.config.ts
```

## 5. Browser E2E và blockers

E01–E20 trong STAGING_RELEASE_VALIDATION.md đều **NOT RUN**: không screenshot,
video hoặc HAR staging để chứng minh pass. Test Web Locks/transport mô phỏng không
chứng minh cookie, tab, OAuth, SMTP và proxy thực. nginx -t không chứng minh HTTPS
handshake, browser trust, forwarded IP, cookie flags hoặc SSR runtime.

Blockers trước GO:

- Origin/TLS/ingress và stack cô lập thực, kiểm chứng runtime DB identity.
- SMTP STARTTLS test inbox và Google/Meta test users/callback credentials.
- Phương án payment test an toàn; QA mock project riêng với catalog/coupon QA.
- QA member A/B, admin, products và dữ liệu test không chứa khách hàng.
- Chạy HTTP smoke rồi 20 browser scenarios; lưu evidence đã scrub theo từng case.
- Migration quy mô đại diện trên DB version/collation đích; kế hoạch downtime,
  backup/restore/RPO, audit legacy accounts và approval cutover đồng bộ.
- Pin/vulnerability review images; review persistent Data Protection key protection.

Mức độ: build context thiếu ignore là rủi ro **Cao đã khắc phục cho build mới**;
không biết image/cache cũ có chứa dump không nên không tự kết luận sạch lịch sử.
Thiếu E2E/provider/runtime evidence là **blocker phát hành**, không phải lỗ hổng
đã được khai thác. Mutable tags, schema lock và key-at-rest là rủi ro cần xử lý
trước GO. Không phát hiện hay tuyên bố đã thử xâm nhập production.

## 6. Checklist operator triển khai và rollback

Các bước dưới đây **chưa thực hiện**, không phải chấp thuận deploy production.

1. Chốt source/artifact IDs và contract đồng bộ; lưu evidence local vào nơi kiểm
   soát truy cập. Inventory clients cũ, thông báo buộc login lại khi cutover.
2. Hoàn thiện file riêng staging như mục 3; review project, network, volumes,
   connection host/database/role, SMTP và payment. Không print values bí mật.
3. Từ deployment/staging: `docker compose --env-file staging.env config --quiet`.
   QA mock dùng file env/project khác và thêm `-f compose.yaml -f compose.qa-mock.yaml`.
   Operator chỉ khởi động database sau xác nhận isolation; chưa start API/app.
4. Provision least-privilege app role; apply SQL baseline/target đã review bằng
   migration role qua secure pgpass/service hoặc local container exec. Kiểm tra
   migration history trước; không apply baseline lên database đã có schema.
   Rehearse backup/restore và đối chiếu business UUID/FKs trước khi start app.
5. Operator khởi động API/web/proxy staging đã review. Kiểm tra non-root volume
   permissions, SMTP trust, SSL chain, SSR catalog, Host/forwarded headers;
   Kestrel/PostgreSQL không public. Kiểm tra logs không ghi auth headers/query.
   Access log dùng $uri, không $request/$request_uri; nginx error log ở crit vẫn
   phải hạn chế quyền/retention vì lỗi nghiêm trọng có thể chứa URL đầy đủ.
6. Chạy `Test-StagingReadiness.mjs --verified-isolated-staging` chỉ sau xác minh
   isolation; QA mock thêm --development-mock. Sau đó E01–E20 bằng browser thật.
   Không dùng cookie/JWT thật trong shared log; không gửi tiền hoặc webhook live.
7. Chỉ sau tất cả gate đạt: người có thẩm quyền duyệt release production riêng,
   maintenance window, verified backup/restore, lock timeout/abort criteria và
   coordinated frontend/backend deployment. Không auto-migrate lúc startup.
8. Rollback khi gate/health fail: dừng ingress/mutations và workers; bảo toàn log
   đã scrub, backup và volume; chọn artifact tương thích schema. Không quay về
   frontend cũ với backend cookie mới. Nếu cần rollback schema, restore verified
   backup vào DB mới, đối chiếu UUID/FKs/count/checksum, xác nhận mất dữ liệu theo
   RPO rồi operator đổi endpoint theo approval. Revoke/re-login sessions nếu cần.
   Không chạy Down/drop tables hoặc `compose down -v` theo phản xạ.
9. Sau rollout do operator thực hiện: monitor 401/403/409/429/5xx, SMTP, locks,
   revocation và webhook; chỉ negative/read-only production probes, không live order.

**Sẵn sàng cho bước provision staging thủ công sau khi có input; chưa sẵn sàng production.**
