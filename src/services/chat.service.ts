import { api } from './api';

export interface ChatMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  contenido: string;
  createdAt: string;
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
}

export const getChatHistory = async (otherUserId: string): Promise<ChatMessage[]> => {
  const response = await api.get<ChatHistoryResponse>('/chat/history/' + otherUserId);
  return response.data.messages;
};