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
import { Audio } from 'expo-av';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/src/hooks/useAuth';
import { api } from '@/src/services/api';
import { SocketService } from '@/src/services/socket.service';
import { useSocket } from '@/src/context/SocketContext';
import { getUserChats, getChatMessages, editMessage, deleteMessage, sendAudioMessage, ChatMessage as ChatMessageType } from '@/src/services/chat.service';
import { sendFileMessage } from '@/src/services/chat.service';

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

const AudioPlayer = ({ fileUrl, isSent }: { fileUrl: string, isSent: boolean }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  async function playSound() {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          newSound.setPositionAsync(0);
        }
      });
    }
  }

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isSent ? 'rgba(255,255,255,0.2)' : '#f0f0f0', padding: 8, borderRadius: 20, width: 150 }}
      onPress={playSound}
    >
      <Feather name={isPlaying ? "pause" : "play"} size={24} color={isSent ? '#fff' : '#007AFF'} />
      <View style={{ flex: 1, height: 2, backgroundColor: isSent ? '#fff' : '#007AFF', marginLeft: 8 }} />
    </TouchableOpacity>
  );
};

const extractId = (obj: any): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object' && obj._id) return String(obj._id);
  return String(obj);
};

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
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setCurrentUserId(user._id);
    }
  }, [user]);

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
        const sortedHistory = messagesData.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMessages(sortedHistory);
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
        setMessages((prev) => [message, ...prev]);
      }
    };

    const handleChatRead = (payload: any) => {
      setMessages(prev => prev.map(msg => {
        const isMatch = payload.messageId
          ? msg._id === payload.messageId
          : ((msg as any).chatId === payload.chatId || payload.chatId === currentChatId);

        if (isMatch) {
          const currentReadBy = Array.isArray((msg as any).readBy) ? (msg as any).readBy : [];
          const newReadBy = payload.userId
            ? [...new Set([...currentReadBy, payload.userId])]
            : currentReadBy;

          return {
            ...msg,
            readBy: newReadBy,
            status: 'read'
          };
        }
        return msg;
      }));
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

    const dbReadBy = Array.isArray((selectedMsgOptions as any).readBy) ? (selectedMsgOptions as any).readBy.map(extractId) : [];
    const msgStatus = (selectedMsgOptions as any).status;
    const otherMembers = members.filter(m => extractId(m._id) !== String(currentUserId));
    const hasEveryoneRead = otherMembers.length > 0 && otherMembers.every(m => dbReadBy.includes(extractId(m._id)));

    let infoText = '';

    // Si el backend mandó el status 'read' global pero NO mandó los IDs en readBy
    if (msgStatus === 'read' && dbReadBy.length === 0) {
      infoText = '✓✓ Visto (El servidor no guardó quién lo leyó)\n\n';
      infoText += otherMembers.map(m => `○ (Desconocido) ${m.name || m.username || 'Usuario'}`).join('\n');
    } else {
      if (hasEveryoneRead && otherMembers.length > 0) {
        infoText = '✓✓ Visto por todos los miembros\n\n';
      }
      infoText += otherMembers.map(m => {
        const hasRead = dbReadBy.includes(extractId(m._id));
        return `${hasRead ? '✓✓ (Visto)' : '✓ (Enviado)'} ${m.name || m.username || 'Usuario'}`;
      }).join('\n');
    }

    setSelectedMsgOptions(null);
    Alert.alert('Info. del mensaje', infoText, [{ text: 'Cerrar' }]);
  }, [selectedMsgOptions, members, currentUserId]);

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      const newMsg = await sendFileMessage(currentChatId as string, asset.uri, asset.name, asset.mimeType || 'application/octet-stream');
      setMessages(prev => [newMsg, ...prev]);
    } catch (error) {
      console.error('Error attaching file:', error);
    }
  };

  const handleOpenFile = async (message: any) => {
    try {
      const fileName: string = message.content || message.contenido || '';
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${safeFileName}`;
      const cachedFileInfo = await FileSystem.getInfoAsync(fileUri);
      if (cachedFileInfo.exists) {
        await Sharing.shareAsync(fileUri, { UTI: 'public.item' });
      } else {
        await FileSystem.downloadAsync(message.fileUrl, fileUri);
        await Sharing.shareAsync(fileUri, { UTI: 'public.item' });
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const sendMessage = useCallback(async () => {
    const cleanedMessage = newMessage.trim();
    if (!cleanedMessage || !currentChatId) return;

    if (editingMessage) {
      try {
        const updated = await editMessage(editingMessage._id, cleanedMessage);
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
      content: cleanedMessage,
      clientTimestamp: new Date().toISOString(),
    };

    const localMsg: MessageMessageType = {
      _id: Date.now().toString(),
      senderId: currentUserId!,
      receiverId: currentChatId,
      contenido: cleanedMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [localMsg, ...prev]);

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
  }, [newMessage, currentChatId, editingMessage, currentUserId]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Error al iniciar grabación', err);
    }
  };

  const stopRecording = async () => {
    if (!recording || !currentChatId) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const duration = status.durationMillis / 1000;

      setRecording(null);

      if (uri) {
        const newMsg = await sendAudioMessage(currentChatId, uri, duration);
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === newMsg._id);
          return exists ? prev : [newMsg, ...prev];
        });
      }
    } catch (error) {
      console.error('Error enviando audio grupal', error);
    }
  };

  const renderMessage = ({ item }: { item: MessageMessageType }) => {
    const senderIdStr = extractId(item.senderId);
    const senderNameStr = typeof item.senderId === 'object' ? (item.senderId as any).name : getMemberName(senderIdStr);
    const isSent = senderIdStr === String(currentUserId);
    const isOnline = onlineUsers.includes(senderIdStr);
    const msgType = (item as any).type;

    const dbReadBy = Array.isArray((item as any).readBy) ? (item as any).readBy.map(extractId) : [];
    const otherMembers = members.filter(m => extractId(m._id) !== String(currentUserId));

    // Verifica si TODOS los demás están en el arreglo readBy, O si el status global es 'read'
    const isReadByAll = (otherMembers.length > 0 && otherMembers.every(m => dbReadBy.includes(extractId(m._id)))) || ((item as any).status === 'read');

    const checkIcon = isReadByAll ? 'checkmark-done' : 'checkmark';
    const checkColor = isReadByAll ? '#34b7f1' : (isSent ? 'rgba(255,255,255,0.7)' : '#999');

    if (msgType === 'audio') {
      return (
        <TouchableOpacity activeOpacity={0.7} onLongPress={() => handleLongPress(item)} style={[styles.messageWrapper, isSent ? styles.sentWrapper : styles.receivedWrapper]}>
          {!isSent && (
            <View style={styles.senderRow}>
              <Text style={styles.senderName}>{senderNameStr}</Text>
              {isOnline && <View style={styles.senderOnlineDot} />}
            </View>
          )}
          <View style={[styles.messageBubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
            <AudioPlayer fileUrl={(item as any).fileUrl} isSent={isSent} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 4 }}>
              <Text style={[styles.messageTime, !isSent && { color: '#999' }]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Text>
              {isSent && <Ionicons name={checkIcon} size={16} color={checkColor} />}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (msgType === 'file') {
      return (
        <TouchableOpacity onPress={() => handleOpenFile(item)} onLongPress={() => handleLongPress(item)} style={[styles.messageWrapper, isSent ? styles.sentWrapper : styles.receivedWrapper]}>
          <View style={[styles.messageBubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>📄</Text>
            <Text style={[styles.messageText, isSent ? styles.sentText : styles.receivedText, { fontWeight: '500' }]}>
              {item.contenido || item.content}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

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
            {item.content || item.contenido}
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
        <TouchableOpacity style={styles.membersBar} activeOpacity={0.7} onPress={() => setShowMembersModal(true)}>
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
          <Text style={styles.onlineText}>{onlineCount} en línea <Feather name="chevron-down" size={14} /></Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.messagesList}
          inverted={messages.length > 0}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={handleAttachFile}>
          <Text style={styles.attachButtonText}>Adjuntar</Text>
        </TouchableOpacity>
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
        {newMessage.trim().length > 0 ? (
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            disabled={!newMessage.trim()}
          >
            <Feather name={editingMessage ? 'check' : 'send'} size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: isRecording ? '#FF3B30' : '#34C759' }]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Feather name={isRecording ? "square" : "mic"} size={20} color="#fff" />
          </TouchableOpacity>
        )}
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

      <Modal visible={showMembersModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMembersModal(false)}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <Text style={styles.modalTitle}>Miembros del Grupo</Text>
            <FlatList
              data={members}
              keyExtractor={item => item._id}
              renderItem={({ item }) => {
                const isOnline = onlineUsers.includes(item._id);
                return (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setShowMembersModal(false);
                      if (String(item._id) !== String(currentUserId)) {
                        router.push({
                          pathname: '/user/[id]',
                          params: { id: item._id, name: item.name || item.username, email: item.email || '' }
                        });
                      }
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isOnline ? '#E8F5E9' : '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Feather name="user" size={20} color={isOnline ? '#2E7D32' : '#999'} />
                        {isOnline && <View style={[styles.onlineDot, { right: 0, bottom: 0 }]} />}
                      </View>
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: '500', color: '#333' }}>
                          {item.name || item.username || 'Usuario'}
                          {String(item._id) === String(currentUserId) && ' (Tú)'}
                        </Text>
                        <Text style={{ fontSize: 12, color: isOnline ? '#2E7D32' : '#999' }}>
                          {isOnline ? 'En línea' : 'Desconectado'}
                        </Text>
                      </View>
                    </View>
                    {String(item._id) !== String(currentUserId) && (
                      <Feather name="message-circle" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
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
  attachButton: {
    marginRight: 8,
    backgroundColor: '#34C759',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  attachButtonText: {
    color: '#fff',
    fontWeight: '600',
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
