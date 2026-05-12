import { View, Text, TouchableOpacity, ActivityIndicator, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/src/hooks/useAuth';
import { useUserChats } from '@/src/hooks/queries/useUserChats';

export default function ChatList() {
  const router = useRouter();
  const { user } = useAuth();
  
  const { data: chats = [], isLoading, isRefetching, refetch } = useUserChats();

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
            : otherUser?.avatarUrl || otherUser?.profilePicture;

          const lastMsgText = typeof item.lastMessage === 'string'
            ? item.lastMessage
            : (item.lastMessage?.content || item.lastMessage?.contenido || 'Envía un mensaje para iniciar...');

          return (
            <TouchableOpacity
              className="flex-row p-4 items-center border-b border-gray-200 dark:border-gray-800"
              onPress={() => {
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
                  {lastMsgText}
                </Text>
              </View>

              <Feather name="chevron-right" size={20} className="text-gray-400 dark:text-gray-600" />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
