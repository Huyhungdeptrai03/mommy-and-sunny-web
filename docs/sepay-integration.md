# Tích hợp SePay

## Trạng thái

Repository này chỉ chứa frontend. Thay đổi frontend chưa đủ để bật thanh toán
SePay thực tế: backend tại `NEXT_PUBLIC_API_URL` phải được chuyển đổi và triển khai
cùng lúc. Không gửi giá trị `SePay` đến backend chỉ còn hỗ trợ phương thức cũ.

## Hợp đồng frontend đang sử dụng

- `POST /orders`: `paymentMethod` là `COD` hoặc `SePay`. Các trường địa chỉ,
  mã giảm giá và ghi chú giữ nguyên.
- Response vẫn theo envelope `ApiResponse<CreateOrderResponse>`, gồm
  `orderCode`, `totalAmount`, `status`, `paymentUrl`.
- Backend cung cấp `paymentUrl` HTTPS trỏ tới trang thanh toán đã tạo cho đơn.
  Frontend không tự tạo URL SePay từ mã đơn hoặc số tiền trên trình duyệt.
- Đơn COD không chuyển hướng. Đơn có hàng đặt trước vẫn chỉ dùng COD;
  tiền cọc và phần còn lại theo quy trình riêng hiện có.
- Khi không có URL hợp lệ, frontend giữ mã đơn, hướng dẫn liên hệ hỗ trợ,
  không báo đã thanh toán và không yêu cầu đặt lại đơn.
- `GET /orders/{orderCode}` cung cấp trạng thái thanh toán từ backend.
  Chỉ `paymentStatus = Paid` mới được hiển thị là đã thanh toán.

## Phần phải thực hiện trong backend

1. Đổi enum/validation và dịch vụ tạo thanh toán sang SePay, tính lại tổng tiền
   từ dữ liệu server, kiểm tra quyền sở hữu đơn và quy tắc hàng đặt trước.
2. Tạo phiên hoặc trang thanh toán phù hợp với sản phẩm SePay đã đăng ký.
   Nếu dùng QR chuyển khoản thay vì trang thanh toán có URL, cần thống nhất
   thêm response chứa thông tin ngân hàng/QR trước khi bổ sung UI tương ứng.
3. Lưu tham chiếu thanh toán gắn với đơn trước khi trả response. Khi tạo thanh toán
   lỗi sau khi đơn đã lưu, trả mã đơn với `paymentUrl: null` để tránh tạo lại đơn.
4. Nhận webhook trên backend và xác thực theo cấu hình SePay. Với webhook
   ngân hàng, kiểm tra giao dịch tiền vào, tài khoản nhận, mã tham chiếu đơn,
   số tiền và trạng thái đơn; xử lý thiếu/thừa tiền theo nghiệp vụ đã thống nhất.
5. Lưu ID giao dịch duy nhất và cập nhật đơn trong transaction để webhook gửi
   lại hoặc tới đồng thời không ghi nhận thanh toán nhiều lần. Giao dịch của đơn
   đã hủy cần đối soát, không tự mở lại đơn.
6. Trang khách quay về chỉ hiển thị trạng thái đã lưu. Không cập nhật `Paid`
   từ query string, thông báo của trình duyệt hoặc thao tác quét QR.
7. Giữ các đơn/giao dịch cũ để đối soát. Không đổi hàng loạt phương thức của
   đơn lịch sử sang SePay. Gỡ cấu hình và credentials cũ sau khi xử lý giao dịch
   còn treo; credentials SePay chỉ lưu ở backend, không dùng `NEXT_PUBLIC_*`.

Tài liệu chính thức về webhook ngân hàng:
https://docs.sepay.vn/tich-hop-webhooks.html

## Kiểm thử tích hợp khi có backend

- Đặt đơn COD, đơn SePay, đơn hàng đặt trước và đơn có mã giảm giá.
- Tạo thanh toán lỗi, URL thiếu/sai, khách quay lại khi chưa chuyển tiền.
- Webhook hợp lệ, sai xác thực, sai tài khoản, sai số tiền, sai mã đơn,
  giao dịch tiền ra và webhook trùng/đồng thời.
- Thanh toán khi đơn đã hủy; khách quay về trước khi webhook đến.
- Xác minh tổng tiền, tồn kho và trạng thái đơn không bị cập nhật hai lần.
