"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput(props: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return <div className="relative">
    <input {...props} type={visible ? "text" : "password"} className={`${props.className ?? ""} pr-12`} />
    <button type="button" aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      aria-controls={props.id} aria-pressed={visible} disabled={props.disabled}
      onClick={() => setVisible((value) => !value)}
      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] focus-visible:outline-2 focus-visible:outline-[var(--brand-olive)] disabled:cursor-not-allowed">
      {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  </div>;
}
