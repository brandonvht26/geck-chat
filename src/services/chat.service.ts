import { Platform } from 'react-native';
import { api, ApiError, getToken } from './api';
import * as FileSystem from 'expo-file-system/legacy';

export interface ChatMessage {
  _id: string;
  senderId: any;
  receiverId?: string;
  chatId?: string;
  content?: string;
  contenido?: string;
  createdAt: string;
  readBy?: string[];
  deliveredTo?: string[];
  isDeleted?: boolean;
  isEdited?: boolean;
  type?: string;
  fileUrl?: string;
  duration?: number;
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
  admins?: any[];
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
    
    // 🚀 BYPASS: Le exigimos al servidor 500 mensajes desde el frontend
    const response = await api.get<GetMessagesResponse>(urlDestino, {
      params: { limit: 500 }
    });
    
    return response.data.messages || [];
  } catch (error) {
    const apiError = error as ApiError;
    // Si el chat fue eliminado (404), no logueamos el error para no asustar en la consola
    if (apiError.status !== 404 && (error as any).response?.status !== 404) {
      console.error('Error fetching chat messages:', apiError.message);
    }
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
  const BASE_URL = process.env.EXPO_PUBLIC_API_URI || 'http://localhost:3000';
  try {
    const token = await getToken();
    
    // Copiamos a caché para garantizar un file:// URI
    const localUri = `${FileSystem.cacheDirectory}${name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    await FileSystem.copyAsync({ from: uri, to: localUri });
    const cleanUri = Platform.OS === 'ios' ? localUri.replace('file://', '') : localUri;

    const res = await FileSystem.uploadAsync(`${BASE_URL}/api/chat/file`, cleanUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file', // Probamos con 'file'
      mimeType: mimeType || 'application/octet-stream',
      parameters: { chatId },
      headers: { 
        Authorization: `Bearer ${token}`,
        'x-chat-id': chatId // Enviamos por header para evitar problemas de Multer con el body
      }
    });

    let data;
    try { data = JSON.parse(res.body); } catch(e) { data = { msg: 'Error de parseo' }; }
    
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(data.msg || 'Error al enviar archivo');
    }
    return data.message;
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
  const BASE_URL = process.env.EXPO_PUBLIC_API_URI || 'http://localhost:3000';
  try {
    const token = await getToken();
    
    const safeName = `audio_${Date.now()}.m4a`;
    const localUri = `${FileSystem.cacheDirectory}${safeName}`;
    await FileSystem.copyAsync({ from: uri, to: localUri });
    const cleanUri = Platform.OS === 'ios' ? localUri.replace('file://', '') : localUri;

    const res = await FileSystem.uploadAsync(`${BASE_URL}/api/chat/audio`, cleanUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'audio', // Intentamos primero con 'audio', si no funciona el backend está usando otro nombre
      mimeType: 'audio/m4a',
      parameters: { 
        chatId,
        duration: String(Math.floor(duration))
      },
      headers: { 
        Authorization: `Bearer ${token}`,
        'x-chat-id': chatId,
        'x-duration': String(Math.floor(duration))
      }
    });

    let data;
    try { data = JSON.parse(res.body); } catch(e) { data = { msg: 'Error de parseo' }; }
    
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(data.msg || 'Error al enviar audio');
    }
    return data.message;
  } catch (error: any) {
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
    await api.delete(`/api/chat/${chatId}/delete`);
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
