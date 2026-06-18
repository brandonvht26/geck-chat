import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChatMessages } from '@/src/services/chat.service';
import { useSocket } from '@/src/context/SocketContext';
import axios from 'axios';

export const useChatMessages = (chatId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!chatId || !socket) {
      return;
    }

    socket.emit('join_chat', chatId);

    return () => {
      // Emitir evento para salir de la sala (mejora de optimización)
      socket.emit('leave_chat', chatId);
    };
  }, [chatId, queryClient, socket]);

  return useQuery({
    queryKey: ['chatMessages', chatId],
    queryFn: async () => {
      if (!chatId) return [];
      try {
        const history = await getChatMessages(chatId);
        return history.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (error) {
        // Si el chat fue eliminado (404), retornamos vacío silenciosamente
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!chatId,
    staleTime: 1000 * 60 * 10,
  });
};
