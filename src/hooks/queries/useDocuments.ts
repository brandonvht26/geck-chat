import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

export const useDocuments = (folderId: string | null) => {
  return useQuery({
    queryKey: ['documents', folderId],
    queryFn: async () => {
      // Utilizamos la ruta correcta y pasamos el folderId como parámetro
      const response = await api.get('/api/items/desktop', {
        params: {
          folderId: folderId || 'null',
          workspaceId: 'null',
        },
      });
      
      return response.data?.items || [];
    },
  });
};
