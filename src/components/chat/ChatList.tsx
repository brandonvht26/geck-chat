import { useEffect, useState } from 'react';
import { FlatList, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { getPrivateChats, Chat } from '@/src/services/chat.service';
import { getToken } from '@/src/services/api';
import { api } from '@/src/services/api';

interface ChatWithParticipant extends Chat {
  otherParticipant?: {
    _id: string;
    nombre: string;
    avatar?: string;
  };
}

export default function ChatList() {
  const [chats, setChats] = useState<ChatWithParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = await getToken();
        if (token) {
          const response = await api.get<{ _id: string }>('/api/auth/me');
          setCurrentUserId(response.data._id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchChats = async () => {
      try {
        setLoading(true);
        const privateChats = await getPrivateChats();

        const chatsWithParticipants = await Promise.all(
          privateChats.map(async (chat) => {
            const otherParticipantId = chat.participants.find(id => id !== currentUserId);
            if (otherParticipantId) {
              try {
                const response = await api.get<{ _id: string; nombre: string; avatar?: string }>(
                  `/api/users/${otherParticipantId}`
                );
                return { ...chat, otherParticipant: response.data };
              } catch {
                return { ...chat, otherParticipant: undefined };
              }
            }
            return { ...chat, otherParticipant: undefined };
          })
        );

        setChats(chatsWithParticipants);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [currentUserId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
        renderItem={({ item }) => (
          <View style={styles.chatCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.otherParticipant?.nombre?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>
                {item.otherParticipant?.nombre || 'Usuario desconocido'}
              </Text>
              {item.lastMessage && (
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No tienes conversaciones privadas</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
