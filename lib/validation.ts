// Helper validate dùng chung cho mọi form trong app — khớp đúng quy tắc backend
// (xem *Validator.cs trong Application layer) để báo lỗi ngay trên client, không cần
// chờ round-trip API mới biết sai định dạng.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_REGEX = /^0\d{9,10}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isValidVnPhone(value: string): boolean {
  return VN_PHONE_REGEX.test(value.trim());
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}
