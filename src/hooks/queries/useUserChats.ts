import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserChats, Chat } from '@/src/services/chat.service';
import { useSocket } from '@/src/context/SocketContext';

export const useUserChats = () => {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) {
            return;
        }


        const handleGlobalMessage = (newMessage: any) => {

            queryClient.invalidateQueries({ queryKey: ['userChats'] });
        };

        socket.on('receive_message', handleGlobalMessage);
        socket.on('new_message', handleGlobalMessage);
        socket.on('message_received', handleGlobalMessage);

        return () => {
            socket.off('receive_message', handleGlobalMessage);
            socket.off('new_message', handleGlobalMessage);
            socket.off('message_received', handleGlobalMessage);
        };
    }, [queryClient, socket]);

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
