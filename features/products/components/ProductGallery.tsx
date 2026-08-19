"use client";

import { useEffect, useRef, useState } from "react";
import { ProductImage } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

const ZOOM_FACTOR = 3; // Phóng to 3 lần trong khung bên cạnh
const LENS_SIZE = 150; // Kích thước khung báo hiệu vùng đang phóng to (px)

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });
  // Chỉ bật tính năng phóng to trên thiết bị CÓ hover thật (chuột) — thiết bị cảm ứng
  // không có khái niệm "di chuột", giữ nguyên hành vi bấm-để-xem cũ, tránh trải nghiệm gãy
  const [canHover, setCanHover] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const activeImage = images[activeIndex];

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!canHover || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Giới hạn khung kính lúp không tràn ra ngoài mép ảnh
    const lensX = Math.min(Math.max(x - LENS_SIZE / 2, 0), rect.width - LENS_SIZE);
    const lensY = Math.min(Math.max(y - LENS_SIZE / 2, 0), rect.height - LENS_SIZE);
    setLensPos({ x: lensX, y: lensY });

    setBgPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={imageRef}
          onMouseEnter={() => canHover && setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
          className={`aspect-square overflow-hidden bg-[var(--brand-cream-dark)] relative ${
            canHover ? "cursor-crosshair" : ""
          }`}
        >
          {activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeImage.url}
              alt={productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--brand-text-muted)]">
              Chưa có ảnh
            </div>
          )}

          {/* Khung nhỏ báo hiệu vùng đang được phóng to, di theo đúng vị trí con trỏ */}
          {isZooming && activeImage && (
            <div
              className="absolute border-2 border-white bg-white/30 pointer-events-none"
              style={{ width: LENS_SIZE, height: LENS_SIZE, left: lensPos.x, top: lensPos.y }}
            />
          )}
        </div>

        {/* Khung phóng to — căn theo ĐỈNH ảnh, cao gần bằng ảnh gốc, đúng chuẩn Amazon/Tiki.
            CHẤP NHẬN che tạm phần nội dung phía trên (tên sản phẩm/nút mua) trong lúc đang
            hover — đây là hành vi bình thường của mọi trang TMĐT lớn, chỉ hiện tạm thời và
            biến mất ngay khi rời chuột khỏi ảnh, không ảnh hưởng thao tác thật của khách */}
        {isZooming && activeImage && (
          <div
            className="hidden md:block absolute top-0 left-[calc(100%+12px)] w-[380px] aspect-square border border-[var(--brand-border)] bg-white shadow-lg z-30 overflow-hidden pointer-events-none transition-opacity duration-150"
            style={{
              backgroundImage: `url(${activeImage.url})`,
              backgroundSize: `${ZOOM_FACTOR * 100}%`,
              backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 mt-4">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`w-16 h-16 overflow-hidden border-2 transition-colors ${
                idx === activeIndex ? "border-[var(--brand-text)]" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}