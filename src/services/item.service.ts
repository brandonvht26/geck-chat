import axios from 'axios';
import { api, ApiError, getToken } from './api';
import * as FileSystem from 'expo-file-system/legacy';


export interface DocumentItem {
  _id: string;
  name?: string;
  type?: string;
  url: string;
  fileFormat?: string;
}

export const getDesktopItems = async (): Promise<DocumentItem[]> => {
  try {
    // Pasar folderId y workspaceId como 'null' para obtener items raíz (según item_controller.js)
    const response = await api.get<{ ok: boolean; items: DocumentItem[]; preferences?: any }>('/api/items/desktop', {
      params: {
        folderId: 'null',
        workspaceId: 'null',
      },
    });

    // El backend devuelve { ok: true, items: [...] }
    if (response.data && response.data.items) {
      return response.data.items;
    }

    return [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[getDesktopItems] Error Axios:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('[getDesktopItems] Error desconocido:', error);
    }
    throw error;
  }
};

export const uploadDocument = async (fileUri: string, fileName: string, mimeType: string, parentId: string | null = null): Promise<DocumentItem> => {
  const BASE_URL = process.env.EXPO_PUBLIC_API_URI || 'http://localhost:3000';
  try {
    const token = await getToken();
    
    // Es VITAL copiar el archivo a la caché para asegurar que Expo FileSystem pueda leerlo, 
    // esquivando problemas con content:// URIs en Android.
    const safeName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    const localUri = `${FileSystem.cacheDirectory}${safeName}`;
    await FileSystem.copyAsync({ from: fileUri, to: localUri });
    const cleanUri = Platform.OS === 'ios' ? localUri.replace('file://', '') : localUri;

    const res = await FileSystem.uploadAsync(`${BASE_URL}/api/items/upload`, cleanUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'archivo',
      mimeType: mimeType || 'application/pdf', // fallback explícito en lugar de octet-stream
      parameters: {
        parentId: parentId || 'null',
        x: '100',
        y: '100',
        workspaceId: 'null'
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    let data;
    try { data = JSON.parse(res.body); } catch(e) { data = { msg: 'Error de parseo del servidor' }; }

    if (res.status !== 200 && res.status !== 201) {
      throw { response: { data: { msg: data.msg || 'Error al subir el documento' } } };
    }

    return data.item;
  } catch (error: any) {
    console.error('[uploadDocument] Error:', error);
    throw error;
  }
};

export const searchItems = async (query: string): Promise<DocumentItem[]> => {
  try {
    const response = await api.get('/api/items/all');
    const allItems: DocumentItem[] = response.data.items || response.data || [];

    if (!query || query.trim() === '') return allItems;

    const lowerQuery = query.toLowerCase();
    return allItems.filter(item =>
      item.name?.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('[searchItems] Error al buscar:', error);
    return [];
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/items/delete/${id}`);
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError.message);
  }
};

export const updateItem = async (itemId: string, data: any): Promise<DocumentItem> => {
  try {
    const response = await api.patch<{ ok: boolean; item: DocumentItem }>(`/api/items/update/${itemId}`, data);
    return response.data.item;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[updateItem] Error Axios:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('[updateItem] Error desconocido:', error);
    }
    throw error;
  }
};

export const updateBulkPositions = async (items: any[]): Promise<any> => {
  try {
    const response = await api.patch('/api/items/positions/bulk', { items });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[updateBulkPositions] Error Axios:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('[updateBulkPositions] Error desconocido:', error);
    }
    throw error;
  }
};