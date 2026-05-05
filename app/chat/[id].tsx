import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getChatMessages, sendMessage, ChatMessage } from '@/src/services/chat.service';
import { SocketService } from '@/src/services/socket.service';
import { useAuth } from '@/src/hooks/useAuth';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setCurrentUserId(user._id);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      try {
        if (id) {
          const history = await getChatMessages(id as string);
          // Ordenar: más reciente en índice 0
          const sortedHistory = history.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setMessages(sortedHistory);

          SocketService.emit('join_chat', id as string);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };
    init();

    // Limpieza: salir de la sala al desmontar
    return () => {
      if (id) {
        SocketService.emit('leave_chat', id as string);
      }
    };
  }, [id]);

  useEffect(() => {
    const handleNewMessage = (newMessage: ChatMessage) => {
      // Validación: asegurar que el mensaje pertenece a esta sala
      const chatId = (newMessage as any).chatId || (newMessage as any).workspaceId || (newMessage as any).roomId;
      if (chatId?.toString() !== id?.toString()) {
        return;
      }
      // Evitar duplicados por eco de sockets
      setMessages(prev => {
        const exists = prev.some(msg => msg._id === newMessage._id);
        if (exists) return prev;
        return [newMessage, ...prev];
      });
    };

    SocketService.on('receive_message', handleNewMessage);

    return () => {
      SocketService.off('receive_message', handleNewMessage);
    };
  }, [id]);

  const handleSendMessage = async () => {
    if (!content.trim() || !id) return;

    try {
      const newMsg = await sendMessage(id as string, content);
      // Agregar al inicio porque FlatList está invertido
      setMessages(prev => [newMsg, ...prev]);
      SocketService.emit('new_message', { chatId: id, ...newMsg });
      setContent('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        inverted={true}
        keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
        renderItem={({ item }) => {
          const sender = (item as any).senderId;
          const senderId = typeof sender === 'object' ? sender?._id : sender;
          const senderName = typeof sender === 'object' ? (sender?.name || sender?.username || 'Usuario') : 'Usuario';
          const isMyMessage = senderId === currentUserId;
          return (
            <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
              {!isMyMessage && (
                <Text style={styles.senderName}>{senderName}</Text>
              )}
              <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                {item.content || item.contenido}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.messagesContainer}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="Escribe un mensaje..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
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
  messagesContainer: {
    padding: 16,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
