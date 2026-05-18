import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserChats, Chat } from '@/src/services/chat.service';
import { SocketService } from '@/src/services/socket.service';

export const useUserChats = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const handleGlobalMessage = (newMessage: any) => {
            queryClient.setQueryData(['userChats'], (oldChats: any) => {
                if (!oldChats) return oldChats;

                const chatIndex = oldChats.findIndex((c: any) =>
                    c._id === newMessage.chatId ||
                    (typeof c.workspaceId === 'object' ? c.workspaceId?._id : c.workspaceId) === newMessage.chatId
                );

                if (chatIndex === -1) return oldChats;

                const newChats = [...oldChats];
                const updatedChat = {
                    ...newChats[chatIndex],
                    lastMessage: newMessage,
                    updatedAt: new Date().toISOString(),
                };

                newChats.splice(chatIndex, 1);
                newChats.unshift(updatedChat);

                return newChats;
            });
        };

        SocketService.on('receive_message', handleGlobalMessage);
        SocketService.on('new_message', handleGlobalMessage);
        SocketService.on('message_received', handleGlobalMessage);

        return () => {
            SocketService.off('receive_message', handleGlobalMessage);
            SocketService.off('new_message', handleGlobalMessage);
            SocketService.off('message_received', handleGlobalMessage);
        };
    }, [queryClient]);

    return useQuery<Chat[]>({
        queryKey: ['userChats'],
        queryFn: async () => {
            const response = await getUserChats();
            return response?.sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            ) || [];
        },
    });
};