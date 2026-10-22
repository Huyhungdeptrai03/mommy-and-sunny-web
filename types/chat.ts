export type ConversationStatus = "Waiting" | "Active" | "Closed";

export interface ChatConversation {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  status: ConversationStatus;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId?: string | null;
  senderName?: string | null;
  senderRole?: string | null;
  isFromAdmin?: boolean;
  content?: string | null;
  imageUrl?: string | null;
  isRead?: boolean;
  createdAt: string;
}
