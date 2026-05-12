import { useQuery } from '@tanstack/react-query';
import { getChatMessages } from '@/src/services/chat.service';

export const useChatMessages = (chatId: string | null | undefined) => {
  return useQuery({
    queryKey: ['chatMessages', chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const history = await getChatMessages(chatId);
      return history.sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!chatId,
    staleTime: 1000 * 60 * 5,
  });
};
