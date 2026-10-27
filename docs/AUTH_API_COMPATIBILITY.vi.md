# Tương thích tạm thời với API authentication cũ

Provider ở layout toàn trang tự gọi initializeSession, lấy CSRF rồi POST refresh-token.
Trước đây CSRF 404 bị coi là lỗi tạm thời, giữ status checking và hiển thị banner,
sau đó focus/pageshow/timer và API client có thể tiếp tục thử kiểm tra phiên.

Khi GET /api/auth/csrf, GET /api/auth/me hoặc POST /api/auth/refresh-token trả 404,
frontend chuyển về anonymous, xóa token/danh tính/cache riêng của thành viên,
đánh dấu sessionUnsupported trong bộ nhớ tab và dừng refresh/revalidation tự động.
Không coi 404 của sản phẩm hay endpoint khác là bằng chứng API session không hỗ trợ.
Không suy diễn khả năng hỗ trợ từ GET refresh-token 405: refresh vẫn dùng POST và CSRF.

Trang công khai tiếp tục gọi API không kèm Bearer token và không hiện banner lỗi session.
Trang cần đăng nhập hiển thị thông báo chưa khả dụng; đăng nhập email/OAuth không gửi
credentials hoặc chuyển hướng OAuth khi đã biết API session chưa được hỗ trợ.
Giỏ hàng hiện tại vốn yêu cầu đăng nhập; không tạo giỏ hàng giả hay cấp quyền truy cập
giỏ hàng thành viên khi anonymous. Quy tắc authorization backend giữ nguyên.
Không dùng contract/token cũ làm đường vòng và không lưu cờ tương thích vào storage.
Các lỗi 401/403/429/5xx vẫn giữ cơ chế xử lý bảo mật/recovery hiện hữu.

Sau khi backend mới triển khai: xác minh CSRF GET và refresh-token POST (cookie,
Origin và CSRF đúng), /auth/me với Bearer, sau đó tải lại trang/mở tab mới.
Frontend tự dò lại và dùng đầy đủ contract mới, không cần thay flag hay đổi code.
Kiểm tra đăng nhập, refresh, đăng xuất, OAuth và trang tài khoản trên môi trường thử.
Chưa deploy, chưa sửa backend/database/VPS trong tác vụ này.
