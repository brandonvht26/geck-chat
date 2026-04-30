import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getChatMessages, sendMessage, ChatMessage } from '@/src/services/chat.service';
import { SocketService } from '@/src/services/socket.service';
import { getToken } from '@/src/services/api';
import { api } from '@/src/services/api';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await getToken();
        if (token) {
          const userResponse = await api.get<{ _id: string }>('/api/auth/me');
          setCurrentUserId(userResponse.data._id);
        }

        if (id) {
          const history = await getChatMessages(id);
          setMessages(history);

          SocketService.emit('join_chat', id);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    const handleNewMessage = (newMessage: ChatMessage) => {
      setMessages(prev => [...prev, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    SocketService.on('message_received', handleNewMessage);

    return () => {
      SocketService.off('message_received');
    };
  }, []);

  const handleSendMessage = async () => {
    if (!content.trim() || !id) return;

    try {
      const newMsg = await sendMessage(id, content);
      setMessages(prev => [...prev, newMsg]);
      SocketService.emit('new_message', { chatId: id, ...newMsg });
      setContent('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
        keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.senderId === currentUserId ? styles.myMessage : styles.otherMessage
          ]}>
            <Text style={styles.messageText}>{item.contenido}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
  messageText: {
    color: '#fff',
    fontSize: 16,
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
