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

        const updateChatLastMessage = (chatIdPayload: any, updater: (chat: any) => any) => {
            if (!chatIdPayload) return;
            queryClient.setQueryData(['userChats'], (oldChats: any[]) => {
                if (!oldChats) return oldChats;
                let chatExists = false;
                const newChats = oldChats.map(chat => {
                    const currentId = typeof chat.workspaceId === 'object' && chat.workspaceId !== null ? chat.workspaceId._id : (chat.workspaceId || chat._id);
                    if (String(currentId) === String(chatIdPayload) || String(chat._id) === String(chatIdPayload)) {
                        chatExists = true;
                        return updater(chat);
                    }
                    return chat;
                });
                
                return newChats.sort((a,b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
            });
            queryClient.invalidateQueries({ queryKey: ['userChats'] });
        };

        const handleNewMessage = (payload: any) => {
            updateChatLastMessage(payload.chatId || payload.workspaceId || payload.roomId, (chat) => ({
                ...chat,
                lastMessage: {
                    _id: payload._id || Date.now().toString(),
                    senderId: payload.senderId,
                    content: payload.content || payload.contenido,
                    type: payload.type || 'text',
                },
                updatedAt: payload.createdAt || new Date().toISOString()
            }));
        };

        const handleMessageEdited = (payload: any) => {
            updateChatLastMessage(payload.chatId || payload.workspaceId || payload.roomId, (chat) => {
                if (chat.lastMessage && String(chat.lastMessage._id) === String(payload._id)) {
                    return {
                        ...chat,
                        lastMessage: {
                            ...chat.lastMessage,
                            content: payload.content || payload.contenido,
                        }
                    };
                }
                return chat;
            });
        };

        const handleMessageDeleted = (payload: any) => {
            updateChatLastMessage(payload.chatId || payload.workspaceId || payload.roomId, (chat) => {
                if (chat.lastMessage && String(chat.lastMessage._id) === String(payload.messageId)) {
                    return {
                        ...chat,
                        lastMessage: {
                            ...chat.lastMessage,
                            content: 'Mensaje eliminado',
                            type: 'text'
                        }
                    };
                }
                return chat;
            });
        };

        socket.on('receive_message', handleNewMessage);
        socket.on('new_message', handleNewMessage);
        socket.on('message_received', handleNewMessage);
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('message_deleted_for_all', handleMessageDeleted);
        socket.on('chat_read', () => queryClient.invalidateQueries({ queryKey: ['userChats'] }));
        socket.on('chat_deleted', () => queryClient.invalidateQueries({ queryKey: ['userChats'] }));

        return () => {
            socket.off('receive_message', handleNewMessage);
            socket.off('new_message', handleNewMessage);
            socket.off('message_received', handleNewMessage);
            socket.off('message_edited', handleMessageEdited);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('message_deleted_for_all', handleMessageDeleted);
            socket.off('chat_read');
            socket.off('chat_deleted');
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
