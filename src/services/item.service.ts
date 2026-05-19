import axios from 'axios';
import { api, ApiError } from './api';

export interface DocumentItem {
  _id: string;
  nombre?: string;
  name?: string;
  tipo?: string;
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

    console.log('[getDesktopItems] Respuesta cruda del backend:', response.data);

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
  try {
    const formData = new FormData();
    formData.append('archivo', {
      uri: fileUri,
      name: fileName,
      type: mimeType || 'application/octet-stream',
    } as any);

    // Campos opcionales que espera el backend
    formData.append('parentId', parentId || 'null');
    formData.append('x', '100');
    formData.append('y', '100');
    formData.append('workspaceId', 'null');

    console.log('[uploadDocument] FormData construido:', {
      uri: fileUri,
      name: fileName,
      type: mimeType || 'application/octet-stream',
      parentId: parentId || 'null',
    });

    const response = await api.post<{ ok: boolean; msg: string; item: DocumentItem }>('/api/items/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log('[uploadDocument] Respuesta exitosa:', response.data);
    // El backend devuelve { ok: true, msg: '...', item: newItem }
    return response.data.item;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[uploadDocument] Error Axios:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('[uploadDocument] Error desconocido:', error);
    }
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
      (item.nombre?.toLowerCase().includes(lowerQuery)) ||
      (item.name?.toLowerCase().includes(lowerQuery))
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