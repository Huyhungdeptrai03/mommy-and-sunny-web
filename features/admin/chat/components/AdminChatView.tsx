"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";
import { assignConversation, closeConversation, getAdminConversations, getChatMessages, markConversationRead, sendChatMessage } from "@/features/chat/api";
import { ChatConversation, ChatMessage, ConversationStatus } from "@/types/chat";

const STATUS_LABELS: Record<ConversationStatus, string> = { Waiting: "Đang chờ", Active: "Đang hỗ trợ", Closed: "Đã đóng" };

export default function AdminChatView() {
  const [status, setStatus] = useState<ConversationStatus | "">("");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selected, setSelected] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const result = await getAdminConversations({ status: status || undefined, pageSize: 100 });
      setConversations(result.items);
      setSelected((current) => current ? result.items.find((item) => item.id === current.id) ?? current : result.items[0] ?? null);
      setError(null);
    } catch {
      setError("Không thể tải danh sách hội thoại");
    }
  }, [status]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const result = await getChatMessages(conversationId);
      setMessages(result.items);
      await markConversationRead(conversationId).catch(() => undefined);
    } catch {
      setError("Không thể tải tin nhắn");
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadConversations(), 0);
    const interval = setInterval(() => void loadConversations(), 5000);
    return () => { clearTimeout(initialLoad); clearInterval(interval); };
  }, [loadConversations]);

  useEffect(() => {
    if (!selected) return;
    const initialLoad = setTimeout(() => void loadMessages(selected.id), 0);
    const interval = setInterval(() => void loadMessages(selected.id), 3000);
    return () => { clearTimeout(initialLoad); clearInterval(interval); };
  }, [selected, loadMessages]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleAssign() {
    if (!selected) return;
    try { await assignConversation(selected.id); await loadConversations(); }
    catch { setError("Không thể nhận hội thoại"); }
  }

  async function handleClose() {
    if (!selected) return;
    try { await closeConversation(selected.id); await loadConversations(); }
    catch { setError("Không thể đóng hội thoại"); }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = content.trim();
    if (!selected || !normalized || normalized.length > 2000) return;
    setIsSending(true);
    try {
      const message = await sendChatMessage(selected.id, normalized);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setContent("");
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message ? err.response.data.message : "Không thể gửi tin nhắn");
    } finally { setIsSending(false); }
  }

  return (
    <main className="p-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)]">Chat khách hàng</h1>
        <select value={status} onChange={(event) => setStatus(event.target.value as ConversationStatus | "")} className="border border-[var(--brand-border)] bg-white px-3 py-2 text-sm">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      {error && <p className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <div className="grid min-h-[650px] grid-cols-[300px_1fr] border border-[var(--brand-border)] bg-white">
        <aside className="border-r border-[var(--brand-border)]">
          {conversations.length === 0 && <p className="p-5 text-sm text-[var(--brand-text-muted)]">Chưa có hội thoại.</p>}
          {conversations.map((conversation) => (
            <button key={conversation.id} type="button" onClick={() => setSelected(conversation)} className={`block w-full border-b border-[var(--brand-border)] p-4 text-left ${selected?.id === conversation.id ? "bg-[var(--brand-cream-dark)]" : "hover:bg-[var(--brand-cream)]"}`}>
              <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{conversation.userName ?? conversation.userEmail ?? "Khách hàng"}</p>{Boolean(conversation.unreadCount) && <span className="rounded-full bg-[var(--brand-olive)] px-2 py-0.5 text-[10px] text-white">{conversation.unreadCount}</span>}</div>
              <p className="mt-1 text-xs text-[var(--brand-text-muted)]">{STATUS_LABELS[conversation.status]}</p>
              {conversation.lastMessage && <p className="mt-2 truncate text-xs text-[var(--brand-text-muted)]">{conversation.lastMessage}</p>}
            </button>
          ))}
        </aside>
        {selected ? (
          <section className="flex min-w-0 flex-col">
            <header className="flex items-center justify-between border-b border-[var(--brand-border)] px-5 py-3">
              <div><p className="font-semibold">{selected.userName ?? "Khách hàng"}</p><p className="text-xs text-[var(--brand-text-muted)]">{selected.userEmail}</p></div>
              <div className="flex gap-2">{selected.status === "Waiting" && <button type="button" onClick={handleAssign} className="bg-[var(--brand-olive)] px-4 py-2 text-xs font-semibold text-white">Nhận hội thoại</button>}{selected.status !== "Closed" && <button type="button" onClick={handleClose} className="border border-[var(--brand-border)] px-4 py-2 text-xs font-semibold">Đóng</button>}</div>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--brand-cream)] p-5">
              {messages.map((message) => { const fromAdmin = message.isFromAdmin || message.senderRole === "Admin"; return <div key={message.id} className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}><div className={`max-w-[70%] px-3 py-2 text-sm ${fromAdmin ? "bg-[var(--brand-olive)] text-white" : "border border-[var(--brand-border)] bg-white"}`}><p className="whitespace-pre-wrap break-words">{message.content}</p><p className={`mt-1 text-[10px] ${fromAdmin ? "text-white/60" : "text-[var(--brand-text-muted)]"}`}>{new Date(message.createdAt).toLocaleString("vi-VN")}</p></div></div>; })}
              <div ref={endRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[var(--brand-border)] p-4"><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={2} maxLength={2000} disabled={selected.status === "Closed"} placeholder={selected.status === "Closed" ? "Hội thoại đã đóng" : "Nhập nội dung trả lời..."} className="flex-1 resize-none border border-[var(--brand-border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-olive)] disabled:bg-gray-100" /><button type="submit" disabled={isSending || !content.trim() || selected.status === "Closed"} className="flex w-12 items-center justify-center bg-[var(--brand-olive)] text-white disabled:opacity-40"><Send size={18} /></button></form>
          </section>
        ) : <div className="flex items-center justify-center text-sm text-[var(--brand-text-muted)]">Chọn một hội thoại để bắt đầu.</div>}
      </div>
    </main>
  );
}
