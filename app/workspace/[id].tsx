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
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/src/services/api';
import { SocketService } from '@/src/services/socket.service';
import { useSocket } from '@/src/context/SocketContext';
import { getUserChats, getChatMessages, editMessage, deleteMessage, ChatMessage as ChatMessageType } from '@/src/services/chat.service';

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
  const [members, setMembers] = useState<any[]>([]);
  const [editingMessage, setEditingMessage] = useState<MessageMessageType | null>(null);
  const [readBy, setReadBy] = useState<Record<string, string[]>>({});
  const [selectedMsgOptions, setSelectedMsgOptions] = useState<MessageMessageType | null>(null);

  const { onlineUsers } = useSocket();
  const onlineCount = members.filter(m => onlineUsers.includes(m._id)).length;

  const getMemberName = useCallback((memberId: string) => {
    const member = members.find(m => m._id === memberId);
    return member?.name || member?.username || 'Usuario';
  }, [members]);

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
        setMembers(foundChat.participants || []);
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
    if (currentChatId && currentUserId) {
      SocketService.emit('message_read', { chatId: currentChatId, userId: currentUserId });
    }
  }, [currentChatId, currentUserId]);

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

    const handleChatRead = (payload: any) => {
      if (payload.messageId) {
        setReadBy(prev => ({
          ...prev,
          [payload.messageId]: [...new Set([...(prev[payload.messageId] || []), payload.userId])],
        }));
      }
    };

    SocketService.on('message_received', handleMessageReceived);
    SocketService.on('chat_read', handleChatRead);

    return () => {
      SocketService.off('message_received', handleMessageReceived);
      SocketService.off('chat_read', handleChatRead);
    };
  }, [currentChatId]);

  const handleLongPress = useCallback((item: MessageMessageType) => {
    const senderIdStr = typeof item.senderId === 'object' ? (item.senderId as any)._id : item.senderId;
    if (senderIdStr === currentUserId) {
      setSelectedMsgOptions(item);
    }
  }, [currentUserId]);

  const showInfoAction = useCallback(() => {
    if (!selectedMsgOptions) return;
    const readUserIds = readBy[selectedMsgOptions._id] || [];
    const msgStatus = (selectedMsgOptions as any).status;
    let infoText = '';

    if (msgStatus === 'read') {
      infoText = '✓✓ Visto por todos los miembros';
    } else {
      const readCount = readUserIds.length;
      infoText = members.map(m => {
        const hasRead = readUserIds.includes(m._id);
        return `${hasRead ? '✓' : '○'} ${m.name || m.username || 'Usuario'}`;
      }).join('\n');
      if (readCount > 0) {
        infoText = `${readCount} de ${members.length} lo han visto\n\n${infoText}`;
      }
    }
    setSelectedMsgOptions(null);
    Alert.alert('Info. del mensaje', infoText, [{ text: 'Cerrar' }]);
  }, [selectedMsgOptions, readBy, members]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentChatId) return;

    if (editingMessage) {
      try {
        const updated = await editMessage(editingMessage._id, newMessage.trim());
        setMessages(prev => prev.map(msg =>
          msg._id === editingMessage._id ? updated : msg
        ));
        setNewMessage('');
        setEditingMessage(null);
      } catch {
        Toast.show({ type: 'error', text1: 'Error al editar mensaje' });
      }
      return;
    }

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
  }, [newMessage, currentChatId, editingMessage]);

  const renderMessage = ({ item }: { item: MessageMessageType }) => {
    const senderIdStr = typeof item.senderId === 'object' ? (item.senderId as any)._id : item.senderId;
    const senderNameStr = typeof item.senderId === 'object' ? (item.senderId as any).name : getMemberName(senderIdStr);
    const isSent = senderIdStr === currentUserId;
    const isOnline = onlineUsers.includes(senderIdStr);
    const messageStatus = (item as any).status;
    const checkIcon = messageStatus === 'read' ? 'checkmark-done' : 'checkmark';
    const checkColor = messageStatus === 'read' ? '#34b7f1' : (isSent ? 'rgba(255,255,255,0.7)' : '#999');

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onLongPress={() => handleLongPress(item)}
        style={[styles.messageWrapper, isSent ? styles.sentWrapper : styles.receivedWrapper]}
      >
        {!isSent && (
          <View style={styles.senderRow}>
            <Text style={styles.senderName}>{senderNameStr}</Text>
            {isOnline && <View style={styles.senderOnlineDot} />}
          </View>
        )}
        <View style={[styles.messageBubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
          <Text style={[styles.messageText, isSent ? styles.sentText : styles.receivedText]}>
            {item.contenido}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 4 }}>
            <Text style={[styles.messageTime, !isSent && { color: '#999' }]}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </Text>
            {isSent && (
              <Ionicons name={checkIcon} size={16} color={checkColor} />
            )}
          </View>
        </View>
      </TouchableOpacity>
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

      {members.length > 0 && (
        <View style={styles.membersBar}>
          <View style={styles.membersAvatars}>
            {members.slice(0, 5).map((member) => {
              const isOnline = onlineUsers.includes(member._id);
              return (
                <View key={member._id} style={styles.memberAvatarWrapper}>
                  <View style={[styles.memberAvatar, { backgroundColor: isOnline ? '#E8F5E9' : '#f0f0f0' }]}>
                    <Feather name="user" size={16} color={isOnline ? '#2E7D32' : '#999'} />
                  </View>
                  {isOnline && <View style={styles.onlineDot} />}
                </View>
              );
            })}
            {members.length > 5 && (
              <View style={styles.memberAvatar}>
                <Text style={styles.moreMembersText}>+{members.length - 5}</Text>
              </View>
            )}
          </View>
          <Text style={styles.onlineText}>{onlineCount} en línea</Text>
        </View>
      )}

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
          placeholder={editingMessage ? 'Editando mensaje...' : 'Escribe un mensaje...'}
          placeholderTextColor="#999"
          multiline
          maxLength={500}
        />
        {editingMessage && (
          <TouchableOpacity
            onPress={() => { setEditingMessage(null); setNewMessage(''); }}
            style={styles.cancelEditButton}
          >
            <Feather name="x" size={20} color="#666" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={sendMessage}
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          disabled={!newMessage.trim()}
        >
          <Feather name={editingMessage ? 'check' : 'send'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <Toast />

      <Modal visible={!!selectedMsgOptions} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedMsgOptions(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Opciones del mensaje</Text>

            <TouchableOpacity style={styles.modalButton} onPress={showInfoAction}>
              <Feather name="info" size={20} color="#007AFF" />
              <Text style={styles.modalButtonText}>Ver Información</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={() => {
              setEditingMessage(selectedMsgOptions);
              setNewMessage(selectedMsgOptions!.contenido);
              setSelectedMsgOptions(null);
            }}>
              <Feather name="edit-2" size={20} color="#007AFF" />
              <Text style={styles.modalButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={async () => {
              const msgId = selectedMsgOptions!._id;
              setSelectedMsgOptions(null);
              await deleteMessage(msgId, 'for_me');
              setMessages(prev => prev.filter(msg => msg._id !== msgId));
            }}>
              <Feather name="trash" size={20} color="#FF3B30" />
              <Text style={[styles.modalButtonText, { color: '#FF3B30' }]}>Eliminar para mí</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={async () => {
              const msgId = selectedMsgOptions!._id;
              setSelectedMsgOptions(null);
              await deleteMessage(msgId, 'for_all');
              setMessages(prev => prev.map(msg => msg._id === msgId ? { ...msg, contenido: 'Mensaje eliminado' } : msg));
            }}>
              <Feather name="trash-2" size={20} color="#FF3B30" />
              <Text style={[styles.modalButtonText, { color: '#FF3B30' }]}>Eliminar para todos</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  membersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  membersAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatarWrapper: {
    marginRight: -6,
    position: 'relative',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  onlineText: {
    fontSize: 13,
    color: '#888',
  },
  moreMembersText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
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
  messageWrapper: {
    marginBottom: 8,
  },
  sentWrapper: {
    alignSelf: 'flex-end',
  },
  receivedWrapper: {
    alignSelf: 'flex-start',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginRight: 6,
  },
  senderOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  sentBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
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
  cancelEditButton: {
    marginLeft: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalButtonText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#007AFF',
  },
});
