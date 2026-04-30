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

export interface Chat {
  _id: string;
  workspaceId?: string | { _id: string };
  participants: string[];
  lastMessage?: string;
  updatedAt: string;
}

interface GetChatsResponse {
  chats: Chat[];
}

interface GetMessagesResponse {
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

export const getUserChats = async (): Promise<Chat[]> => {
  try {
    const response = await api.get<GetChatsResponse>('/api/chat/chat');
    return response.data.chats;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error fetching user chats:', apiError.message);
    throw error;
  }
};

export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  try {
    const response = await api.get<GetMessagesResponse>('/api/chat/' + chatId + '/chat');
    return response.data.messages;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error fetching chat messages:', apiError.message);
    throw error;
  }
};