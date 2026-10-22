"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { ADMIN_SUCCESS_EVENT } from "@/lib/admin-notification";

const DISPLAY_DURATION_MS = 3500;
const EXIT_DURATION_MS = 220;

export default function AdminSuccessToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [toastId, setToastId] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);
  }

  function dismiss() {
    clearTimers();
    setIsLeaving(true);
    removeTimeoutRef.current = setTimeout(() => {
      setMessage(null);
      setIsLeaving(false);
    }, EXIT_DURATION_MS);
  }

  useEffect(() => {
    function handleSuccess(event: Event) {
      const customEvent = event as CustomEvent<string>;

      clearTimers();
      setIsLeaving(false);
      setMessage(customEvent.detail);
      setToastId((current) => current + 1);
      timeoutRef.current = setTimeout(() => {
        setIsLeaving(true);
        removeTimeoutRef.current = setTimeout(() => {
          setMessage(null);
          setIsLeaving(false);
        }, EXIT_DURATION_MS);
      }, DISPLAY_DURATION_MS);
    }

    window.addEventListener(ADMIN_SUCCESS_EVENT, handleSuccess);
    return () => {
      window.removeEventListener(ADMIN_SUCCESS_EVENT, handleSuccess);
      clearTimers();
    };
  }, []);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm md:right-6 md:top-6">
      <div
        key={toastId}
        role="status"
        aria-live="polite"
        className={`admin-toast pointer-events-auto relative overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-[0_18px_50px_-16px_rgba(30,41,59,0.38)] backdrop-blur-xl ${
          isLeaving ? "admin-toast--leaving" : ""
        }`}
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
        <div className="flex items-center gap-3.5 px-4 py-4 pl-5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
            <span className="absolute inset-1 rounded-full bg-emerald-500/10" />
            <Check size={21} strokeWidth={3} className="relative text-emerald-600" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
              Thành công
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{message}</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Đóng thông báo"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X size={16} />
          </button>
        </div>
        <div className="h-1 bg-emerald-50">
          <div className="admin-toast__progress h-full origin-left bg-gradient-to-r from-emerald-400 to-emerald-600" />
        </div>
      </div>
    </div>
  );
}
