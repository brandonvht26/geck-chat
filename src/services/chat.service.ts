import { api, ApiError } from './api';

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
  try {
    const response = await api.get<ChatHistoryResponse>('/api/chat/history/' + otherUserId);
    return response.data?.messages || response.data || [];
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error fetching chat history:', apiError.message);
    throw error;
  }
};