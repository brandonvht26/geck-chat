import { api } from './api';
import { ShareDocumentPayload, ShareDocumentResponse } from '../types/document.types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const shareDocument = async (
  itemId: string,
  email: string,
  permission: 'read' | 'edit'
): Promise<ShareDocumentResponse> => {
  try {
    const response = await api.post(`/api/items/share/${itemId}`, { email, permission });
    const data = response.data as ShareDocumentResponse;

    if (!data.ok) {
      throw new Error(data.msg || 'Error al compartir documento');
    }

    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.msg || error.message || 'Error al compartir documento'
    );
  }
};

export const downloadDocument = async (url: string, fileName: string): Promise<void> => {
  try {
    const downloadDir = FileSystem.cacheDirectory;
    if (!downloadDir) {
      throw new Error('No se pudo acceder al directorio de caché');
    }

    const localUri = `${downloadDir}${fileName}`;
    const downloadResult = await FileSystem.downloadAsync(url, localUri);

    if (downloadResult.status !== 200) {
      throw new Error(`Error en la descarga: estado ${downloadResult.status}`);
    }

    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      throw new Error('El sistema no soporta compartir archivos');
    }

    await Sharing.shareAsync(localUri);
  } catch (error: any) {
    throw new Error(
      error.message || 'Error al descargar o compartir el documento'
    );
  }
};
