"use client";

import { useEffect } from "react";

// Nhúng widget chat Tawk.to (miễn phí) — cần đăng ký tài khoản tại https://www.tawk.to,
// lấy Property ID + Widget ID rồi khai báo NEXT_PUBLIC_TAWKTO_PROPERTY_ID /
// NEXT_PUBLIC_TAWKTO_WIDGET_ID trong .env.local. Không cấu hình thì không render gì,
// tránh lỗi script khi thiếu ID.
const PROPERTY_ID = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID;
const WIDGET_ID = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;

export default function LiveChatWidget() {
  useEffect(() => {
    if (!PROPERTY_ID || !WIDGET_ID) return;
    if (document.getElementById("tawkto-script")) return;

    const script = document.createElement("script");
    script.id = "tawkto-script";
    script.async = true;
    script.src = `https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.body.appendChild(script);
  }, []);

  return null;
}
