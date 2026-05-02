import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getUserChats, Chat } from '@/src/services/chat.service';
import { useAuth } from '@/src/hooks/useAuth';
import { api } from '@/src/services/api';

interface ChatWithDisplay extends Chat {
  displayTitle: string;
  displayAvatar: string;
}

export default function ChatList() {
  const [chats, setChats] = useState<ChatWithDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const fetchChats = useCallback(async () => {
    if (!user?._id) return;
    console.log("📡 [ChatList] Pidiendo chats al servidor...");
    setIsLoading(true);
    try {
      const response = await getUserChats();
      console.log("✅ [ChatList] Chats recibidos:", response?.length);
      
      const sortedChats = response.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      const chatsWithDisplay = await Promise.all(
        sortedChats.map(async (chat) => {
          let displayTitle = 'Chat';
          let displayAvatar = '?';

          if (chat.isGroup) {
            if (typeof chat.workspaceId === 'object' && chat.workspaceId?.name) {
              displayTitle = chat.workspaceId.name;
            }
            displayAvatar = (displayTitle.charAt(0)).toUpperCase();
          } else {
            const otherParticipantId = chat.participants.find(id => id !== user._id);
            if (otherParticipantId) {
              try {
                const userResponse = await api.get<{ _id: string; nombre: string; avatar?: string }>(
                  `/api/users/${otherParticipantId}`
                );
                displayTitle = userResponse.data.nombre;
                displayAvatar = userResponse.data.nombre?.charAt(0).toUpperCase() || '?';
              } catch {
                displayTitle = 'Usuario desconocido';
                displayAvatar = '?';
              }
            }
          }

          return { ...chat, displayTitle, displayAvatar };
        })
      );

      setChats(chatsWithDisplay);
    } catch (error) {
      console.error("❌ [ChatList] Error obteniendo chats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const renderChatItem = ({ item }: { item: ChatWithDisplay }) => (
    <TouchableOpacity 
      style={styles.chatCard}
      onPress={() => handleChatPress(item._id)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, item.isGroup && styles.groupAvatar]}>
        <Text style={styles.avatarText}>
          {item.displayAvatar}
        </Text>
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>
            {item.displayTitle}
          </Text>
          {item.isGroup && (
            <View style={styles.groupBadge}>
              <Text style={styles.groupBadgeText}>Grupo</Text>
            </View>
          )}
        </View>
        {item.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={fetchChats} 
        style={styles.reloadButton}
      >
        <Text style={styles.reloadButtonText}>Recargar Chats Manualmente</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tienes conversaciones</Text>
            </View>
          }
          renderItem={renderChatItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupAvatar: {
    backgroundColor: '#34C759',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  groupBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  groupBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  reloadButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  reloadButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});