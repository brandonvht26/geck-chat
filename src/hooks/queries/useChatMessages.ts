import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChatMessages } from '@/src/services/chat.service';
import { useSocket } from '@/src/context/SocketContext';

export const useChatMessages = (chatId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!chatId || !socket) {
      console.log('🛑 [RADAR 1] Hook sin chatId o sin socket activo.', { chatId, hasSocket: !!socket });
      return;
    }

    console.log(`🔌 [RADAR 2] Socket activo. Escuchando sala: ${chatId}`);

    socket.emit('join_chat', chatId);

    const handleNewMessage = (newMessage: any) => {
      console.log('🚨 [RADAR 3 - ÉXITO] MENSAJE RECIBIDO VÍA SOCKET:', newMessage);

      queryClient.invalidateQueries({ queryKey: ['chatMessages', chatId] });

      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    };

    const handleEdit = (editedMsg: any) => {
      queryClient.setQueryData(['chatMessages', chatId], (old: any) =>
        old ? old.map((m: any) => m._id === editedMsg._id ? editedMsg : m) : []
      );
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    };

    const handleDelete = ({ messageId, content }: any) => {
      queryClient.setQueryData(['chatMessages', chatId], (old: any) =>
        old ? old.map((m: any) => m._id === messageId ? { ...m, content, isDeleted: true } : m) : []
      );
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('new_message', handleNewMessage);
    socket.on('message_received', handleNewMessage);
    socket.on('message_edited', handleEdit);
    socket.on('message_deleted_for_all', handleDelete);

    return () => {
      console.log(`🔌 [RADAR 4] Desmontando listeners de la sala: ${chatId}`);
      
      // Desconectar todos los listeners para evitar fugas de memoria
      socket.off('receive_message', handleNewMessage);
      socket.off('new_message', handleNewMessage);
      socket.off('message_received', handleNewMessage);
      socket.off('message_edited', handleEdit);
      socket.off('message_deleted_for_all', handleDelete);
      
      // Emitir evento para salir de la sala (mejora de optimización)
      socket.emit('leave_chat', chatId);
      console.log(`🚪 [RADAR 5] Salido de la sala: ${chatId}`);
    };
  }, [chatId, queryClient, socket]);

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
  });
};
