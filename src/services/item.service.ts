// src/services/item.service.ts
import { api, getToken } from './api';
import { Platform } from 'react-native';

export interface DocumentItem {
  _id: string;
  name: string;
  type: string;
  fileFormat?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getAllDocuments = async (): Promise<DocumentItem[]> => {
  try {
    const response = await api.get('/api/items/all');
    return response.data?.items || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

export const uploadDocument = async (uri: string, name: string, mimeType: string) => {
  const formData = new FormData();

  // A veces iOS o Android añaden prefijos raros a la URI, esta limpieza ayuda:
  const cleanUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;

  formData.append('archivo', {
    uri: cleanUri,
    name: name || 'documento.pdf', // Un fallback por si viene vacío
    type: mimeType || 'application/octet-stream', // Fallback crucial
  } as any);

  const token = await getToken();
  const baseURL = api.defaults.baseURL || 'https://geck-core.onrender.com';
  
  const response = await fetch(`${baseURL}/api/items/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error al subir el documento');
  }

  return data;
};
