"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import axios from "axios";
import { getChatMessages, getOrCreateCurrentConversation, markConversationRead, sendChatMessage } from "@/features/chat/api";
import { useAuthStore } from "@/store/authStore";
import { ChatMessage } from "@/types/chat";

const POLL_INTERVAL_MS = 4000;

export default function LiveChatWidget() {
  const { user, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    let active = true;

    async function load() {
      try {
        const conversation = await getOrCreateCurrentConversation();
        if (!active) return;
        setConversationId(conversation.id);
        const result = await getChatMessages(conversation.id);
        if (!active) return;
        setMessages(result.items);
        setError(null);
        await markConversationRead(conversation.id).catch(() => undefined);
      } catch (err) {
        if (!active) return;
        setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : "Không thể kết nối bộ phận hỗ trợ");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    const initialLoad = setTimeout(() => void load(), 0);
    const intervalId = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearTimeout(initialLoad);
      clearInterval(intervalId);
    };
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedContent = content.trim();
    if (!conversationId || !normalizedContent) return;
    if (normalizedContent.length > 2000) {
      setError("Tin nhắn tối đa 2000 ký tự");
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const message = await sendChatMessage(conversationId, normalizedContent);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setContent("");
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : "Không thể gửi tin nhắn");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {isOpen && (
        <section className="mb-3 flex h-[min(520px,70vh)] w-[min(360px,calc(100vw-3rem))] flex-col overflow-hidden border border-[var(--brand-border)] bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-[var(--brand-olive)] px-4 py-3 text-white">
            <div>
              <p className="font-heading text-sm font-bold uppercase tracking-wide">Hỗ trợ khách hàng</p>
              <p className="text-xs text-white/70">Crab Be Bé sẽ phản hồi sớm nhất</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng trò chuyện"><X size={20} /></button>
          </header>

          {!isAuthenticated ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <MessageCircle size={34} className="text-[var(--brand-olive)]" />
              <p className="mt-3 text-sm text-[var(--brand-text)]">Vui lòng đăng nhập để trò chuyện và xem lại lịch sử hỗ trợ.</p>
              <Link href="/login" className="mt-4 bg-[var(--brand-olive)] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white">Đăng nhập</Link>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--brand-cream)] p-4">
                {isLoading && messages.length === 0 && <p className="text-center text-xs text-[var(--brand-text-muted)]">Đang kết nối...</p>}
                {!isLoading && messages.length === 0 && !error && <p className="text-center text-sm text-[var(--brand-text-muted)]">Xin chào {user?.fullName}, bạn cần Crab Be Bé hỗ trợ gì?</p>}
                {messages.map((message) => {
                  const isMine = message.senderId === user?.id || (message.senderRole !== "Admin" && !message.isFromAdmin);
                  return (
                    <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[82%] px-3 py-2 text-sm ${isMine ? "bg-[var(--brand-olive)] text-white" : "border border-[var(--brand-border)] bg-white text-[var(--brand-text)]"}`}>
                        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                        <p className={`mt-1 text-[10px] ${isMine ? "text-white/60" : "text-[var(--brand-text-muted)]"}`}>{new Date(message.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              {error && <p className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600" aria-live="polite">{error}</p>}
              <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[var(--brand-border)] p-3">
                <textarea value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={2000} placeholder="Nhập tin nhắn..." className="min-h-10 flex-1 resize-none border border-[var(--brand-border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-olive)]" />
                <button type="submit" disabled={isSending || !content.trim()} aria-label="Gửi tin nhắn" className="flex h-10 w-10 items-center justify-center bg-[var(--brand-olive)] text-white disabled:opacity-40"><Send size={17} /></button>
              </form>
            </>
          )}
        </section>
      )}
      <button type="button" onClick={() => { setIsOpen((value) => !value); if (!isOpen && isAuthenticated) setIsLoading(true); }} aria-label={isOpen ? "Đóng trò chuyện" : "Chat với Crab Be Bé"} className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-olive)] text-white shadow-xl transition-transform hover:scale-105">{isOpen ? <X size={24} /> : <MessageCircle size={25} />}</button>
    </div>
  );
}
