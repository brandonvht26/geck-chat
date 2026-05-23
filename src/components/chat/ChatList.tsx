import { View, Text, TouchableOpacity, ActivityIndicator, Image, FlatList } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/src/hooks/useAuth';
import { useUserChats } from '@/src/hooks/queries/useUserChats';
import { SocketService } from '@/src/services/socket.service';
import { useQueryClient } from '@tanstack/react-query';

export default function ChatList() {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?._id;
  
  const { data: chats = [], isLoading, isRefetching, refetch } = useUserChats();

  const queryClient = useQueryClient();

  useEffect(() => {
    const updateGlobalList = () => {
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    };

    SocketService.on('message_received', updateGlobalList);
    SocketService.on('chat_read', updateGlobalList);
    SocketService.on('chat_deleted', updateGlobalList);
    SocketService.on('new_chat_created', updateGlobalList);

    return () => {
      SocketService.off('message_received', updateGlobalList);
      SocketService.off('chat_read', updateGlobalList);
      SocketService.off('chat_deleted', updateGlobalList);
      SocketService.off('new_chat_created', updateGlobalList);
    };
  }, [queryClient]);

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
        data={chats}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <Text className="text-center mt-5 text-gray-500 dark:text-gray-400">
            No tienes conversaciones
          </Text>
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

          // Obtener el contador de no leídos para el usuario actual
          const unreadCount = currentUserId ? (item.unreadCounts?.[currentUserId] || 0) : 0;

          // Saber si el último mensaje fue enviado por el usuario actual
          const senderId = typeof item.lastMessage?.senderId === 'object' 
            ? item.lastMessage?.senderId?._id 
            : item.lastMessage?.senderId;
          const isMyLastMessage = !!senderId && !!currentUserId && String(senderId) === String(currentUserId);

          return (
            <TouchableOpacity
              className="flex-row p-4 items-center border-b border-gray-200 dark:border-gray-800"
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
                  className="w-12 h-12 rounded-full mr-4"
                  resizeMode="cover"
                />
              ) : (
                <View className={`w-12 h-12 rounded-full justify-center items-center mr-4 ${item.isGroup ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Feather name={item.isGroup ? "users" : "user"} size={24} color={item.isGroup ? "#1976D2" : "#757575"} />
                </View>
              )}

              <View className="flex-1">
                <Text className="text-base font-semibold text-textMain dark:text-textMain-dark">
                  {displayTitle}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1" numberOfLines={1}>
                  {isMyLastMessage && (
                    <Text className="text-gray-700 dark:text-gray-300 font-bold">Tú: </Text>
                  )}
                  {lastMsgText}
                </Text>
              </View>

              {/* CONTENEDOR HORA Y BURBUJA DE NO LEÍDOS */}
              <View className="items-end justify-center ml-3">
                {/* Hora del último mensaje */}
                {item.updatedAt && (
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {new Date(item.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                )}

                {/* BURBUJA DE MENSAJES NO LEÍDOS - ESTILO WHATSAPP */}
                {unreadCount > 0 && (
                  <View className="bg-green-500 h-5 min-w-[20px] rounded-full items-center justify-center px-1.5">
                    <Text className="text-white text-xs font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>

              <Feather name="chevron-right" size={20} className="text-gray-400 dark:text-gray-600 ml-2" />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
