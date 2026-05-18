import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChatMessages } from '@/src/services/chat.service';
import { SocketService } from '@/src/services/socket.service';

export const useChatMessages = (chatId: string | null | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;

    const handleNewMessage = (newMessage: any) => {
      if (newMessage.chatId !== chatId && newMessage.workspaceId !== chatId) return;

      queryClient.setQueryData(['chatMessages', chatId], (oldMessages: any) => {
        if (!oldMessages) return [newMessage];

        const exists = oldMessages.some((msg: any) => msg._id === newMessage._id);
        if (exists) return oldMessages;

        return [newMessage, ...oldMessages];
      });
    };

    SocketService.on('receive_message', handleNewMessage);
    SocketService.on('new_message', handleNewMessage);
    SocketService.on('message_received', handleNewMessage);

    return () => {
      SocketService.off('receive_message', handleNewMessage);
      SocketService.off('new_message', handleNewMessage);
      SocketService.off('message_received', handleNewMessage);
    };
  }, [chatId, queryClient]);

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
