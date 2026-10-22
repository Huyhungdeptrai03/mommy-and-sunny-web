// Helper validate dùng chung cho mọi form trong app — khớp đúng quy tắc backend
// (xem *Validator.cs trong Application layer) để báo lỗi ngay trên client, không cần
// chờ round-trip API mới biết sai định dạng.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_REGEX = /^0\d{9}$/;
const FULL_NAME_REGEX = /^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u;
const EMAIL_MAX_LENGTH = 254;
const FULL_NAME_MIN_LENGTH = 2;
const FULL_NAME_MAX_LENGTH = 100;
const PASSWORD_MIN_LENGTH = 8;

export function isValidEmail(value: string): boolean {
  const normalizedValue = value.trim();
  return normalizedValue.length <= EMAIL_MAX_LENGTH && EMAIL_REGEX.test(normalizedValue);
}

export function isValidVnPhone(value: string): boolean {
  return VN_PHONE_REGEX.test(value.trim());
}

export function isValidFullName(value: string): boolean {
  const normalizedValue = value.trim();
  return (
    normalizedValue.length >= FULL_NAME_MIN_LENGTH &&
    normalizedValue.length <= FULL_NAME_MAX_LENGTH &&
    FULL_NAME_REGEX.test(normalizedValue)
  );
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

export function isValidPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function isNonBlank(value: string): boolean {
  return value.trim().length > 0;
}

export function isWithinLength(value: string, maxLength: number): boolean {
  return value.trim().length <= maxLength;
}

export function isNonNegativeInteger(value: string): boolean {
  if (!value.trim()) return true;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0;
}
