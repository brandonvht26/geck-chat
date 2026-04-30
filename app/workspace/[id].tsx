import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/src/services/api';
import { SocketService } from '@/src/services/socket.service';
import { getUserChats, getChatMessages, ChatMessage as ChatMessageType } from '@/src/services/chat.service';

interface WorkspaceParams {
  id: string;
  name: string;
}

interface MessageReceivedPayload {
  chatId: string;
  content: string;
  senderId: string;
  createdAt: string;
  _id?: string;
}

const CURRENT_USER_ID_KEY = '@geckchat_user_id';

export default function WorkspaceScreen() {
  const { id, name } = useLocalSearchParams<WorkspaceParams>();
  const router = useRouter();
  const flatListRef = useRef<FlatList<MessageMessageType>>(null);

  const [messages, setMessages] = useState<MessageMessageType[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadWorkspaceChat = useCallback(async () => {
    try {
      const chatsResponse = await getUserChats();
      const foundChat = chatsResponse.find((c) => {
        const workspaceIdValue =
          typeof c.workspaceId === 'object' && c.workspaceId !== null
            ? c.workspaceId._id
            : c.workspaceId;
        return workspaceIdValue === id;
      });

      if (foundChat) {
        setCurrentChatId(foundChat._id);
        const messagesData = await getChatMessages(foundChat._id);
        setMessages(messagesData);
        SocketService.emit('join_chat', foundChat._id);
      } else {
        setMessages([]);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error cargando historial',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const initUser = async () => {
      const userId = await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
      setCurrentUserId(userId);
    };
    initUser();
    loadWorkspaceChat();
  }, [loadWorkspaceChat]);

  useEffect(() => {
    const handleMessageReceived = (payload: MessageReceivedPayload) => {
      if (payload.chatId === currentChatId) {
        const message: MessageMessageType = {
          _id: payload._id || Date.now().toString(),
          senderId: payload.senderId,
          receiverId: payload.chatId,
          contenido: payload.content,
          createdAt: payload.createdAt,
        };
        setMessages((prev) => [...prev, message]);
      }
    };

    SocketService.on('message_received', handleMessageReceived);

    return () => {
      SocketService.off('message_received', handleMessageReceived);
    };
  }, [currentChatId]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentChatId) return;

    const msgData = {
      chatId: currentChatId,
      content: newMessage.trim(),
      clientTimestamp: new Date().toISOString(),
    };

    try {
      await api.post('/api/chat/message', msgData);
      SocketService.emit('new_message', msgData);
      setNewMessage('');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error enviando mensaje',
      });
    }
  }, [newMessage, currentChatId]);

  const renderMessage = ({ item }: { item: MessageMessageType }) => {
    const isSent = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageBubble,
          isSent ? styles.sentBubble : styles.receivedBubble,
        ]}
      >
        <Text
          style={[styles.messageText, isSent ? styles.sentText : styles.receivedText]}
        >
          {item.contenido}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="message-square" size={48} color="#ccc" />
      <Text style={styles.emptyText}>Aún no hay mensajes en este escritorio</Text>
      <Text style={styles.emptySubtext}>Sé el primero en escribir</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Feather name="users" size={18} color="#007AFF" />
          <Text style={styles.headerTitle}>{name}</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/invite-member',
              params: { workspaceId: id },
            })
          }
          style={styles.inviteButton}
        >
          <Feather name="user-plus" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* TODO: Agregar indicador de estado en línea (puntito verde) de los miembros del workspace */}
      {/* <View style={styles.onlineIndicator}><View style={styles.onlineDot} /><Text style={styles.onlineText}>3 en línea</Text></View> */}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          disabled={!newMessage.trim()}
        >
          <Feather name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <Toast />
    </KeyboardAvoidingView>
  );
}

type MessageMessageType = ChatMessageType;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  inviteButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  sentBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentText: {
    color: '#fff',
  },
  receivedText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});