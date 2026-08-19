"use client";

import { useEffect, useState } from "react";

interface VNWard {
  name: string;
  code: number;
}

interface VNProvince {
  name: string;
  code: number;
  wards: VNWard[];
}

interface AddressSelectorProps {
  province: string;
  ward: string;
  onProvinceChange: (name: string) => void;
  onWardChange: (name: string) => void;
  inputClass: string;
}

// Chọn Tỉnh/Thành + Xã/Phường theo ĐÚNG hệ thống hành chính hiện hành của Việt Nam
// (2 cấp, áp dụng từ 1/7/2025 — không còn Quận/Huyện). Dữ liệu lấy từ API công khai
// provinces.open-api.vn (bản v2, dành riêng cho hệ thống 2 cấp sau sáp nhập).
//
// CÓ CƠ CHẾ DỰ PHÒNG: nếu API bên thứ 3 lỗi/không phản hồi được, tự động chuyển
// sang 2 ô nhập tay — tránh việc 1 dịch vụ miễn phí bên ngoài làm tắc nghẽn checkout
export default function AddressSelector({
  province,
  ward,
  onProvinceChange,
  onWardChange,
  inputClass,
}: AddressSelectorProps) {
  const [provinces, setProvinces] = useState<VNProvince[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("https://provinces.open-api.vn/api/v2/?depth=2")
      .then((res) => {
        if (!res.ok) throw new Error("Fetch thất bại");
        return res.json();
      })
      .then((data: VNProvince[]) => {
        if (!cancelled) setProvinces(data);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProvince = provinces.find((p) => p.name === province);

  // Dự phòng — API lỗi thì để khách tự gõ tay, không chặn hẳn việc đặt hàng
  if (loadFailed) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Tỉnh/Thành"
          value={province}
          onChange={(e) => onProvinceChange(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Xã/Phường"
          value={ward}
          onChange={(e) => onWardChange(e.target.value)}
          className={inputClass}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        value={province}
        disabled={isLoading}
        onChange={(e) => {
          onProvinceChange(e.target.value);
          onWardChange(""); // đổi tỉnh -> reset xã/phường đã chọn trước đó
        }}
        className={inputClass}
      >
        <option value="">{isLoading ? "Đang tải..." : "Chọn Tỉnh/Thành"}</option>
        {provinces.map((p) => (
          <option key={p.code} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        value={ward}
        disabled={!selectedProvince}
        onChange={(e) => onWardChange(e.target.value)}
        className={inputClass}
      >
        <option value="">
          {selectedProvince ? "Chọn Xã/Phường" : "Chọn Tỉnh/Thành trước"}
        </option>
        {selectedProvince?.wards.map((w) => (
          <option key={w.code} value={w.name}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
}