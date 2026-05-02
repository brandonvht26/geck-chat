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
  workspaceId?: any; 
  participants: any[]; 
  isGroup: boolean;
  lastMessage?: any; 
  updatedAt: string;
}

interface GetChatsResponse {
  chats: Chat[];
}

interface GetMessagesResponse {
  messages: ChatMessage[];
}

interface AccessChatResponse {
  chat: Chat;
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

export const getPrivateChats = async (): Promise<Chat[]> => {
  try {
    const response = await api.get<GetChatsResponse>('/api/chat/chat');
    const chats = response.data.chats;
    return chats.filter(chat => chat.isGroup === false);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error fetching private chats:', apiError.message);
    throw error;
  }
};

export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  try {
    const urlDestino = '/api/chat/' + chatId + '/chat';
    // RADAR 4: La dirección exacta que intenta golpear Axios
    console.log("🕵️‍♂️ RADAR 4 - URL EXACTA DISPARADA POR AXIOS:", urlDestino);
    
    const response = await api.get<GetMessagesResponse>(urlDestino);
    return response.data.messages;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error fetching chat messages:', apiError.message);
    throw error;
  }
};

export const sendMessage = async (chatId: string, content: string): Promise<ChatMessage> => {
  try {
    const clientTimestamp = new Date();
    const response = await api.post<{ message: ChatMessage }>('/api/chat/message', { chatId, content, clientTimestamp });
    return response.data.message;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error sending message:', apiError.message);
    throw error;
  }
};

export const accessUserChat = async (targetUserId: string): Promise<Chat> => {
  try {
    const response = await api.post<AccessChatResponse>('/api/chat/access', { userId: targetUserId });
    return response.data.chat;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error accessing user chat:', apiError.message);
    throw error;
  }
};