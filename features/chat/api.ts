import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { ChatConversation, ChatMessage, ConversationStatus } from "@/types/chat";

export async function getOrCreateCurrentConversation(): Promise<ChatConversation> {
  const response = await apiClient.post<ApiResponse<ChatConversation>>("/chat/conversations/current");
  return response.data.data;
}

export async function getConversation(conversationId: string): Promise<ChatConversation> {
  const response = await apiClient.get<ApiResponse<ChatConversation>>(
    `/chat/conversations/${conversationId}`
  );
  return response.data.data;
}

export async function getChatMessages(
  conversationId: string,
  page = 1,
  pageSize = 100
): Promise<PagedResult<ChatMessage>> {
  const response = await apiClient.get<ApiResponse<PagedResult<ChatMessage>>>(
    `/chat/conversations/${conversationId}/messages`,
    { params: { page, pageSize } }
  );
  return response.data.data;
}

export async function sendChatMessage(
  conversationId: string,
  content: string
): Promise<ChatMessage> {
  const response = await apiClient.post<ApiResponse<ChatMessage>>(
    `/chat/conversations/${conversationId}/messages`,
    { content, imageUrl: null }
  );
  return response.data.data;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await apiClient.post(`/chat/conversations/${conversationId}/read`);
}

export async function getAdminConversations(params?: {
  status?: ConversationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<ChatConversation>> {
  const response = await apiClient.get<ApiResponse<PagedResult<ChatConversation>>>(
    "/admin/chat/conversations",
    { params }
  );
  return response.data.data;
}

export async function assignConversation(conversationId: string): Promise<void> {
  await apiClient.post(`/admin/chat/conversations/${conversationId}/assign`);
}

export async function closeConversation(conversationId: string): Promise<void> {
  await apiClient.post(`/admin/chat/conversations/${conversationId}/close`);
}
