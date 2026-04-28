import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import { getChatHistory, ChatMessage } from '@/src/services/chat.service';
import { getToken } from '@/src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_USER_ID_KEY = '@geckchat_user_id';

interface ChatParams {
  id: string;
  name?: string;
}

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams<ChatParams>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const userId = await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
        setCurrentUserId(userId);

        setIsLoading(true);
        const history = await getChatHistory(id);
        setMessages(history);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.error('Error loading chat history:', error);
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URI || 'http://localhost:3000';
      const baseUrl = apiUrl.replace('/api', '');
      const newSocket = io(baseUrl);

      newSocket.on('connect', () => {
        console.log('Socket connected - Chat tunnel open');
      });

      newSocket.on('receiveMessage', (message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    };

    initChat();
  }, [id]);

  const sendMessage = () => {
    if (!inputText.trim() || !socket || !currentUserId) {
      Alert.alert('Error', 'No se puede enviar el mensaje. Intenta de nuevo.');
      return;
    }

    const messagePayload = {
      receiverId: id,
      contenido: inputText.trim(),
      senderId: currentUserId,
    };

    socket.emit('sendMessage', messagePayload);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'} Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name || 'Chat'}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        inverted={true}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

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
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
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
    backgroundColor: '#e5e5ea',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});