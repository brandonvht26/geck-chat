import { api, ApiError } from './api';

export interface ChatMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  contenido: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
  pagination?: PaginationInfo;
}

export interface Chat {
  _id: string;
  workspaceId?: any; 
  participants: any[]; 
  isGroup: boolean;
  lastMessage?: any; 
  updatedAt: string;
  unreadCounts?: Record<string, number>;
}

interface GetChatsResponse {
  chats: Chat[];
}

interface GetMessagesResponse {
  messages: ChatMessage[];
  pagination?: PaginationInfo;
}

interface AccessChatResponse {
  chat: Chat;
}

export const getChatHistory = async (otherUserId: string): Promise<ChatMessage[]> => {
  try {
    const response = await api.get<ChatHistoryResponse>('/api/chat/history/' + otherUserId);
    // ¡CLAVE! El backend ahora devuelve { ok: true, messages: [...], pagination: {...} }
    // Extraemos el array 'messages' para mantener compatibilidad
    return response.data?.messages || [];
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
  } catch (error: any) {
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const isNetworkError = error.message === 'Network Error';

    // Solo imprimimos el error si NO es de autenticación ni de red
    if (!isAuthError && !isNetworkError) {
      console.error('Error fetching user chats:', error.message || error);
    }
    
    throw error; // Mantenemos el throw para React Query
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
    
    // ¡CLAVE! El backend ahora devuelve { ok: true, messages: [...], pagination: {...} }
    // Extraemos el array 'messages' para no romper el FlatList
    return response.data.messages || [];
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

export const sendFileMessage = async (chatId: string, uri: string, name: string, mimeType: string) => {
  try {
    const formData = new FormData();
    formData.append('chatId', chatId);
    // El backend exige que el campo se llame 'file' o 'document'
    formData.append('file', {
      uri,
      name,
      type: mimeType,
    } as any);

    // Nota: Ajusta la ruta a '/api/chat/file' si corregiste el backend, 
    // o mantenla como '/api/chat/chat/file' si el router sigue igual.
    const response = await api.post('/api/chat/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data.message;
  } catch (error) {
    console.error('Error en sendFileMessage:', error);
    throw error;
  }
};

export const editMessage = async (messageId: string, content: string): Promise<ChatMessage> => {
  const response = await api.patch<{ message: ChatMessage }>(`/api/chat/message/${messageId}`, { content });
  return response.data.message;
};

export const deleteMessage = async (messageId: string, type: 'for_me' | 'for_all'): Promise<void> => {
  await api.delete(`/api/chat/message/${messageId}`, { data: { type } });
};

export const sendAudioMessage = async (chatId: string, uri: string, duration: number) => {
  try {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('duration', duration.toString());
    // El backend exige que el campo se llame 'audio'
    formData.append('audio', {
      uri,
      name: `audio_${Date.now()}.m4a`,
      type: 'audio/m4a',
    } as any);

    const response = await api.post('/api/chat/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data.message;
  } catch (error) {
    console.error('Error en sendAudioMessage:', error);
    throw error;
  }
};

export const markChatAsRead = async (chatId: string) => {
  try {
    const response = await api.patch(`/api/chat/${chatId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking chat as read:', error);
    throw error;
  }
};

export const deleteGroupChat = async (chatId: string): Promise<void> => {
  try {
    await api.delete(`/api/chat/${chatId}`);
  } catch (error) {
    console.error('Error eliminando grupo:', error);
    throw error;
  }
};

export const deleteChat = async (chatId: string) => {
  try {
    const response = await api.delete(`/api/chat/${chatId}/delete`);
    return response.data;
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};