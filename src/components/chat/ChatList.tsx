import { View, Text, TouchableOpacity, ActivityIndicator, Image, FlatList } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/src/hooks/useAuth';
import { useUserChats } from '@/src/hooks/queries/useUserChats';
import { SocketService } from '@/src/services/socket.service';
import { useQueryClient } from '@tanstack/react-query';

// 🚀 Recibimos el término de búsqueda desde el Home
interface ChatListProps {
  activeTab: 'privados' | 'workspaces';
  searchTerm: string; 
}

export default function ChatList({ activeTab, searchTerm }: ChatListProps) {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?._id;
  
  const { data: chats = [], isLoading, isRefetching, refetch } = useUserChats();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleGlobalUpdate = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
      const targetChatId = payload?.chatId || payload?.workspaceId || payload?.roomId;
      if (targetChatId) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', targetChatId] });
      }
    };

    const handleMessageReceived = (payload: any) => {
      handleGlobalUpdate(payload);
      if (payload && payload.chatId && currentUserId) {
        const senderIdStr = typeof payload.senderId === 'object' ? payload.senderId._id : payload.senderId;
        if (String(senderIdStr) !== String(currentUserId)) {
          SocketService.emit('mark_delivered', { messageId: payload._id, chatId: payload.chatId, userId: currentUserId });
        }
      }
    };

    SocketService.on('message_received', handleMessageReceived);
    SocketService.on('chat_read', handleGlobalUpdate);
    SocketService.on('chat_deleted', handleGlobalUpdate);
    SocketService.on('new_chat_created', handleGlobalUpdate);
    SocketService.on('message_status_update', handleGlobalUpdate);
    SocketService.on('chat_status_bulk_update', handleGlobalUpdate);
    SocketService.on('workspace-member-joined', handleGlobalUpdate);
    SocketService.on('workspace_joined', handleGlobalUpdate);

    return () => {
      SocketService.off('message_received', handleMessageReceived);
      SocketService.off('chat_read', handleGlobalUpdate);
      SocketService.off('chat_deleted', handleGlobalUpdate);
      SocketService.off('new_chat_created', handleGlobalUpdate);
      SocketService.off('message_status_update', handleGlobalUpdate);
      SocketService.off('chat_status_bulk_update', handleGlobalUpdate);
      SocketService.off('workspace-member-joined', handleGlobalUpdate);
      SocketService.off('workspace_joined', handleGlobalUpdate);
    };
  }, [queryClient, currentUserId]);

  // 🚀 EL FILTRO MÁGICO DOBLE: Por pestaña y por texto
  const filteredChats = chats.filter((chat) => {
    // 1. Filtro de Pestaña
    if (activeTab === 'privados' && chat.isGroup) return false;
    if (activeTab === 'workspaces' && !chat.isGroup) return false;

    // 2. Filtro de Búsqueda (Sensible a mayúsculas y minúsculas)
    if (searchTerm.trim() !== '') {
        const otherUser = chat.isGroup ? null : chat.participants?.find((p: any) => (p?._id || p) !== user?._id);
        const displayTitle = chat.isGroup
            ? chat.workspaceId?.name || 'Grupo sin nombre'
            : otherUser?.name || otherUser?.username || 'Usuario';
        
        if (!displayTitle.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
    }

    return true;
  });

  if (isLoading && !isRefetching) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-authEnd-dark">
        <ActivityIndicator size="large" className="text-primary dark:text-primary-dark" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      <FlatList
        data={filteredChats}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20 px-8">
            <View className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary-dark/20 justify-center items-center mb-6">
                <Feather 
                    name={searchTerm ? 'search' : (activeTab === 'privados' ? 'message-circle' : 'briefcase')} 
                    size={36} 
                    className="text-primary dark:text-primary-dark" 
                />
            </View>
            <Text className="text-center text-lg font-nunito-bold text-textMain dark:text-textMain-dark mb-2">
                {searchTerm 
                  ? 'No hay resultados' 
                  : (activeTab === 'privados' ? 'Sin mensajes recientes' : 'Sin Workspaces')}
            </Text>
            <Text className="text-center text-gray-500 dark:text-gray-400 font-nunito-regular leading-6">
                {searchTerm
                  ? `No encontramos nada que coincida con "${searchTerm}".`
                  : (activeTab === 'privados' 
                    ? 'Willy está descansando 🦎.\n¡Busca a alguien e inicia una conversación!' 
                    : 'Willy no tiene equipos asignados 🦎.\nCrea un workspace para colaborar sin límites.')}
            </Text>
          </View>
        }
        keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
        renderItem={({ item }) => {
          const otherUser = item.isGroup ? null : item.participants?.find((p: any) =>
            (p?._id || p) !== (user?._id)
          );

          const displayTitle = item.isGroup
            ? item.workspaceId?.name || 'Grupo sin nombre'
            : otherUser?.name || otherUser?.username || 'Usuario';

          const imageUrl = item.isGroup
            ? item.workspaceId?.imageUrl
            : otherUser?.avatarUrl || otherUser?.userId?.avatarUrl || otherUser?.profilePicture;

          let lastMsgText = 'Envía un mensaje para iniciar...';
          
          if (item.lastMessage) {
            const msgType = item.lastMessage.type;
            if (msgType === 'audio') {
              lastMsgText = '🎵 Audio';
            } else if (msgType === 'file') {
              lastMsgText = `📄 ${item.lastMessage.content || 'Archivo'}`;
            } else {
              lastMsgText = typeof item.lastMessage === 'string' 
                ? item.lastMessage 
                : (item.lastMessage.content || item.lastMessage.contenido || lastMsgText);
            }
          }

          const unreadCount = currentUserId ? (item.unreadCounts?.[currentUserId] || 0) : 0;
          const senderId = typeof item.lastMessage?.senderId === 'object' 
            ? item.lastMessage?.senderId?._id 
            : item.lastMessage?.senderId;
          const isMyLastMessage = !!senderId && !!currentUserId && String(senderId) === String(currentUserId);

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              className="flex-row p-4 items-center border-b border-gray-100 dark:border-gray-800/60"
              onPress={() => {
                if (currentUserId) {
                  queryClient.setQueryData(['userChats'], (oldChats: any[]) => {
                    if (!oldChats) return oldChats;
                    return oldChats.map(c => 
                      c._id === item._id 
                        ? { ...c, unreadCounts: { ...c.unreadCounts, [currentUserId]: 0 } }
                        : c
                    );
                  });
                }

                if (item.isGroup) {
                  const wsId = typeof item.workspaceId === 'object' ? item.workspaceId._id : item.workspaceId;
                  router.push(`/workspace/${wsId}?name=${encodeURIComponent(displayTitle)}`);
                } else {
                  router.push(`/chat/${item._id}`);
                }
              }}
            >
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  className="w-14 h-14 rounded-full mr-4 border border-gray-200 dark:border-gray-700"
                  resizeMode="cover"
                />
              ) : (
                <View className={`w-14 h-14 rounded-full justify-center items-center mr-4 border border-transparent ${item.isGroup ? 'bg-primary/10 dark:bg-primary-dark/20 border-primary/20' : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'}`}>
                  <Feather name={item.isGroup ? "users" : "user"} size={24} color={item.isGroup ? "#2A72D4" : "#9CA3AF"} />
                </View>
              )}

              <View className="flex-1">
                <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark" numberOfLines={1}>
                  {displayTitle}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1" numberOfLines={1}>
                  {isMyLastMessage && (
                    <Text className="text-gray-700 dark:text-gray-300 font-bold">Tú: </Text>
                  )}
                  {lastMsgText}
                </Text>
              </View>

              <View className="items-end justify-center ml-3">
                {item.updatedAt && (
                  <Text className="text-xs font-snpro-regular text-gray-400 dark:text-gray-500 mb-1.5">
                    {new Date(item.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                )}
                {unreadCount > 0 && (
                  <View className="bg-green-500 min-w-[22px] h-[22px] rounded-full items-center justify-center px-1.5 shadow-sm shadow-green-500/30">
                    <Text className="text-white text-xs font-snpro-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}