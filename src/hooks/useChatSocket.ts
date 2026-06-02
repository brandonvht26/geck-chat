import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SocketService } from '@/src/services/socket.service';

const extractId = (obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object' && obj._id) return String(obj._id);
    return String(obj);
};

interface UseChatSocketProps {
    chatId: string | null;
    currentUserId: string | null;
    onMembersChange?: () => void; // 🚀 Callback especial para Workspaces
}

export const useChatSocket = ({ chatId, currentUserId, onMembersChange }: UseChatSocketProps) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!chatId || !currentUserId) return;

        const handleMessageReceived = (payload: any) => {
            const incomingChatId = extractId(payload.chatId || payload.workspaceId || payload.roomId);
            if (incomingChatId !== String(chatId)) return;

            const message = {
                _id: payload._id || Date.now().toString(),
                senderId: payload.senderId,
                receiverId: payload.chatId,
                contenido: payload.content || payload.contenido,
                createdAt: payload.createdAt,
                type: payload.type,
                fileUrl: payload.fileUrl,
                duration: payload.duration,
                readBy: payload.readBy || [],
                deliveredTo: payload.deliveredTo || [],
            };

            queryClient.setQueryData(['chatMessages', chatId], (old: any) => {
                if (!old) return [message];
                const exists = old.some((msg: any) => String(msg._id) === String(message._id));
                if (exists) return old;

                if (String(message.senderId) === String(currentUserId)) {
                    const localMsgIndex = old.findIndex((msg: any) => 
                        String(msg.senderId) === String(currentUserId) &&
                        (msg.content === message.contenido || msg.contenido === message.contenido) &&
                        String(msg._id).length < 20
                    );
                    if (localMsgIndex !== -1) {
                        const newOld = [...old];
                        newOld[localMsgIndex] = message;
                        return newOld;
                    }
                }

                return [message, ...old];
            });

            const senderStr = extractId(payload.senderId);
            if (senderStr !== String(currentUserId)) {
                SocketService.emit('mark_read', { chatId, userId: currentUserId });
            }
            queryClient.invalidateQueries({ queryKey: ['userChats'] });
        };

        const handleMessageStatusUpdate = (payload: any) => {
            queryClient.setQueryData(['chatMessages', chatId], (old: any) => {
                if (!old) return [];
                return old.map((msg: any) => msg._id === payload.messageId
                    ? { ...msg, deliveredTo: payload.deliveredTo, readBy: payload.readBy }
                    : msg
                );
            });
        };

        const handleBulkUpdate = (payload: any) => {
            queryClient.setQueryData(['chatMessages', chatId], (old: any) => {
                if (!old) return [];
                return old.map((msg: any) => {
                    const updatedMsg = payload.updatedMessages?.find((u: any) => u._id === msg._id);
                    if (updatedMsg) {
                        return {
                            ...msg,
                            readBy: updatedMsg.readBy || msg.readBy,
                            deliveredTo: updatedMsg.deliveredTo || msg.deliveredTo
                        };
                    }
                    return msg;
                });
            });
        };

        const handleMessageEdited = (payload: any) => {
            queryClient.setQueryData(['chatMessages', chatId], (old: any) => {
                if (!old) return [];
                return old.map((msg: any) => msg._id === payload._id
                    ? { ...msg, contenido: payload.content || payload.contenido, isEdited: true }
                    : msg
                );
            });
        };

        const handleMessageDeleted = (payload: any) => {
            queryClient.setQueryData(['chatMessages', chatId], (old: any) => {
                if (!old) return [];
                return old.map((msg: any) => msg._id === payload.messageId
                    ? { ...msg, contenido: 'Mensaje eliminado', isDeleted: true }
                    : msg
                );
            });
        };

        const handleMembersUpdate = () => {
            if (onMembersChange) onMembersChange();
        };

        // 📡 Encendemos la antena
        SocketService.on('new_message', handleMessageReceived);
        SocketService.on('message_received', handleMessageReceived);
        SocketService.on('receive_message', handleMessageReceived);
        SocketService.on('message_status_update', handleMessageStatusUpdate);
        SocketService.on('chat_status_bulk_update', handleBulkUpdate);
        SocketService.on('message_edited', handleMessageEdited);
        SocketService.on('message_deleted', handleMessageDeleted);
        SocketService.on('workspace-member-joined', handleMembersUpdate);
        SocketService.on('workspace-member-left', handleMembersUpdate);
        SocketService.on('group-member-left', handleMembersUpdate);

        // 📡 Apagamos la antena al salir
        return () => {
            SocketService.off('new_message', handleMessageReceived);
            SocketService.off('message_received', handleMessageReceived);
            SocketService.off('receive_message', handleMessageReceived);
            SocketService.off('message_status_update', handleMessageStatusUpdate);
            SocketService.off('chat_status_bulk_update', handleBulkUpdate);
            SocketService.off('message_edited', handleMessageEdited);
            SocketService.off('message_deleted', handleMessageDeleted);
            SocketService.off('workspace-member-joined', handleMembersUpdate);
            SocketService.off('workspace-member-left', handleMembersUpdate);
            SocketService.off('group-member-left', handleMembersUpdate);
        };
    }, [chatId, currentUserId, queryClient, onMembersChange]);
};