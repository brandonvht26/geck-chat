import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAudioRecorder, RecordingOptions } from 'expo-audio'; // 🚀 Opciones Importadas
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { toast } from 'sonner-native';
import { useQueryClient } from '@tanstack/react-query';
import { useChatMessages } from '@/src/hooks/queries/useChatMessages';
import { useUserChats } from '@/src/hooks/queries/useUserChats';
import { useAuth } from '@/src/hooks/useAuth';
import { api } from '@/src/services/api';
import { SocketService } from '@/src/services/socket.service';
import { useSocket } from '@/src/context/SocketContext';
import { useChatSocket } from '@/src/hooks/useChatSocket';
import { getUserChats, editMessage, deleteMessage, sendAudioMessage, ChatMessage as ChatMessageType } from '@/src/services/chat.service';
import { sendFileMessage, deleteGroupChat } from '@/src/services/chat.service';
import { leaveWorkspace } from '@/src/services/workspace.service';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import MessageBubble from '@/src/components/chat/MessageBubble';
import ChatInput from '@/src/components/chat/ChatInput';
import AudioPlayer from '@/src/components/chat/AudioPlayer'; 

interface WorkspaceParams {
  id: string;
  name: string;
}

const extractId = (obj: any): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object' && obj._id) return String(obj._id);
  return String(obj);
};

// 🚀 OPCIONES OBLIGATORIAS DE EXPO AUDIO
const audioOptions: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 2,
  bitRate: 128000,
};

export default function WorkspaceScreen() {
  const { id, name } = useLocalSearchParams<WorkspaceParams>();
  const router = useRouter();
  const flatListRef = useRef<FlatList<MessageMessageType>>(null);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [editingMessage, setEditingMessage] = useState<MessageMessageType | null>(null);
  const [selectedMsgOptions, setSelectedMsgOptions] = useState<MessageMessageType | null>(null);
  
  // 🚀 Inyectamos configuración
  const audioRecorder = useAudioRecorder(audioOptions);
  const [isRecording, setIsRecording] = useState(false);
  const startTimeRef = useRef(0);
  
  const hasMarkedRead = useRef(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [unreadSeparatorId, setUnreadSeparatorId] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages = [], isLoading: isChatLoading } = useChatMessages(currentChatId);
  const { data: userChats } = useUserChats();

  useEffect(() => { if (user) setCurrentUserId(user._id); }, [user]);

  const loadWorkspaceChat = useCallback(async () => {
    try {
      const chatsResponse = await getUserChats();
      const foundChat = chatsResponse.find((c) => {
        const workspaceIdValue = typeof c.workspaceId === 'object' && c.workspaceId !== null ? c.workspaceId._id : c.workspaceId;
        return workspaceIdValue === id;
      });

      if (foundChat) {
        setCurrentChatId(foundChat._id);
        setMembers(foundChat.participants || []);
        setWorkspaceData(foundChat.workspaceId || null);

        SocketService.emit('join_chat', foundChat._id);
        const wsId = foundChat.workspaceId?._id || foundChat.workspaceId;
        SocketService.emit('join-workspace-room', wsId);
      }
    } catch (error) {
      toast.error('Error cargando historial');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadWorkspaceChat(); }, [loadWorkspaceChat]);

  // 🚀 ANTENA CONECTADA
  useChatSocket({
    chatId: currentChatId,
    currentUserId: currentUserId,
    onMembersChange: () => {
      loadWorkspaceChat();
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    }
  });

  useEffect(() => {
    if (messages.length > 0 && !unreadSeparatorId && currentUserId) {
      let foundUnreadId = null;
      let foundIndex = -1;

      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        const senderStr = extractId(m.senderId);
        const readArr = Array.isArray((m as any).readBy) ? (m as any).readBy.map(extractId) : [];

        if (senderStr !== currentUserId && !readArr.includes(currentUserId)) {
          foundUnreadId = m._id;
          foundIndex = i;
          break;
        }
      }

      if (foundUnreadId) {
        setUnreadSeparatorId(foundUnreadId);
        setTimeout(() => {
          if (flatListRef.current && !hasScrolled) {
            try {
              flatListRef.current.scrollToIndex({ index: foundIndex, animated: true, viewPosition: 0.1 });
              setHasScrolled(true);
            } catch (e) { console.log('Fallo silencioso de scroll', e); }
          }
        }, 300);
      } else {
        setUnreadSeparatorId('none');
      }
    }
  }, [messages.length, currentUserId, unreadSeparatorId, hasScrolled]);

  const { onlineUsers } = useSocket();
  const onlineCount = members.filter(m => onlineUsers.includes(extractId(m._id))).length;

  const getMemberName = useCallback((memberId: string) => {
    const member = members.find(m => m._id === memberId);
    return member?.name || member?.username || 'Usuario';
  }, [members]);

  const currentChatData = userChats?.find(c => c._id === currentChatId);

  const isGroupAdmin = currentChatData?.admins?.some(
    (admin: any) => extractId(admin) === String(currentUserId)
  ) || currentChatData?.workspaceId?.owner === currentUserId;

  useEffect(() => {
    if (!currentChatId || !currentUserId || messages.length === 0 || hasMarkedRead.current) return;
    hasMarkedRead.current = true;

    queryClient.setQueryData(['userChats'], (oldChats: any[]) => {
      if (!oldChats) return oldChats;
      return oldChats.map(chat => String(chat._id) === String(currentChatId) ? { ...chat, unreadCounts: { ...chat.unreadCounts, [currentUserId]: 0 } } : chat);
    });

    SocketService.emit('mark_read', { chatId: currentChatId, userId: currentUserId });
    api.patch(`/api/chat/${currentChatId}/read`).catch(() => { });

    const timer = setTimeout(() => {
      queryClient.setQueryData(['chatMessages', currentChatId], (oldMessages: any[]) => {
        if (!oldMessages) return oldMessages;
        return oldMessages.map(msg => {
          const senderStr = extractId(msg.senderId);
          const readArr = Array.isArray((msg as any).readBy) ? (msg as any).readBy.map(extractId) : [];
          if (senderStr !== String(currentUserId) && !readArr.includes(String(currentUserId))) {
            return {
              ...msg,
              readBy: [...(msg.readBy || []), currentUserId],
              deliveredTo: [...(msg.deliveredTo || []), currentUserId]
            };
          }
          return msg;
        });
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [currentChatId, currentUserId, queryClient, messages.length]);

  const handleLongPress = useCallback((item: MessageMessageType) => {
    const senderIdStr = typeof item.senderId === 'object' ? (item.senderId as any)._id : item.senderId;
    if (senderIdStr === currentUserId) setSelectedMsgOptions(item);
  }, [currentUserId]);

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('Archivo muy pesado', 'Por favor, selecciona un archivo menor a 5MB.');
        return;
      }

      const safeFileName = asset.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const safeMimeType = asset.mimeType || 'application/octet-stream';
      const newMsg = await sendFileMessage(currentChatId!, asset.uri, safeFileName, safeMimeType);

      queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => {
        if (!old) return [newMsg];
        return old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old];
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo adjuntar el archivo al grupo.');
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
    } catch (error) { console.error('Error opening file:', error); }
  };

  const sendMessageLocal = useCallback(async () => {
    const cleanedMessage = newMessage.trim();
    if (!cleanedMessage || !currentChatId) return;

    if (editingMessage) {
      try {
        const updated = await editMessage(editingMessage._id, cleanedMessage);
        queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) =>
          old ? old.map(msg => msg._id === editingMessage._id ? updated : msg) : []
        );
        setNewMessage('');
        setEditingMessage(null);
      } catch { toast.error('Error al editar mensaje'); }
      return;
    }

    const msgData = { chatId: currentChatId, content: cleanedMessage, clientTimestamp: new Date().toISOString() };
    const localMsg: MessageMessageType = {
      _id: Date.now().toString(), senderId: currentUserId!, receiverId: currentChatId,
      contenido: cleanedMessage, createdAt: new Date().toISOString()
    };

    queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => old ? [localMsg, ...old] : [localMsg]);

    try {
      await api.post('/api/chat/message', msgData);
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    } catch (error) { toast.error('Error enviando mensaje'); }
  }, [newMessage, currentChatId, editingMessage, currentUserId, queryClient]);

  const startRecording = async () => {
    try {
      await audioRecorder.record();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      try { require('expo-haptics').impactAsync(); } catch { }
    } catch (err) { console.error('Error al iniciar grabación', err); }
  };

  const stopRecording = async () => {
    if (!isRecording || !currentChatId) return;
    setIsRecording(false);
    const elapsed = Date.now() - startTimeRef.current;
    
    try {
      await audioRecorder.stop();
      if (elapsed < 500) return; 
      
      const uri = audioRecorder.uri;
      if (uri) {
        const duration = elapsed / 1000;
        const newMsg = await sendAudioMessage(currentChatId, uri, duration);
        queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => {
          if (!old) return [newMsg];
          const exists = old.some(msg => msg._id === newMsg._id);
          return exists ? old : [newMsg, ...old];
        });
      }
    } catch (error) { console.error('Error enviando audio grupal', error); }
  };

  const handleLeaveGroup = () => {
    Alert.alert('Abandonar grupo', '¿Estás seguro de que deseas salir de este grupo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => {
          try {
            queryClient.cancelQueries({ queryKey: ['chatMessages', currentChatId] });
            router.replace('/home');
            await leaveWorkspace(id);
            queryClient.removeQueries({ queryKey: ['chatMessages', currentChatId] });
            queryClient.invalidateQueries({ queryKey: ['userChats'] });
            toast.success('Has salido del grupo');
          } catch (error: any) { toast.error(error.response?.data?.msg || 'Error al salir del grupo'); }
        }
      }
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert('Eliminar grupo', 'Esta acción es irreversible.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            queryClient.cancelQueries({ queryKey: ['chatMessages', currentChatId] });
            router.replace('/home');
            await deleteGroupChat(currentChatId!);
            queryClient.removeQueries({ queryKey: ['chatMessages', currentChatId] });
            queryClient.invalidateQueries({ queryKey: ['userChats'] });
            toast.success('Grupo eliminado correctamente');
          } catch (error: any) { toast.error(error.response?.data?.msg || 'Error al eliminar el grupo'); }
        }
      }
    ]);
  };

  const renderMessage = ({ item }: { item: MessageMessageType }) => {
    const senderIdStr = extractId(item.senderId);
    const isSenderObject = typeof item.senderId === 'object' && item.senderId !== null;
    const senderNameStr = isSenderObject ? (item.senderId as any).name : getMemberName(senderIdStr);
    const isSent = senderIdStr === String(currentUserId);
    const isOnline = onlineUsers.includes(senderIdStr);
    const isSeparator = item._id === unreadSeparatorId;

    return (
      <View>
        {isSeparator && (
          <View className="flex-row items-center justify-center my-4 opacity-90">
            <View className="flex-1 h-[1px] bg-indigo-200 dark:bg-indigo-900/50" />
            <View className="bg-indigo-50 dark:bg-indigo-900/40 px-4 py-1.5 rounded-full mx-3 border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm">
              <Text className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">
                Mensajes no leídos
              </Text>
            </View>
            <View className="flex-1 h-[1px] bg-indigo-200 dark:bg-indigo-900/50" />
          </View>
        )}

        <MessageBubble
          item={item}
          isMe={isSent}
          senderName={senderNameStr}
          isOnline={isOnline}
          onLongPress={handleLongPress}
          onOpenFile={handleOpenFile}
          totalParticipants={members.length}
          AudioPlayerComponent={AudioPlayer} 
          isGroupChat={true}
          chatParticipants={members}
        />
      </View>
    );
  };

  const wallpaperUrl = user?.preferences?.phoneWallpaperUrl;
  const RootWrapper = wallpaperUrl ? ImageBackground : (View as any);
  const wrapperProps = wallpaperUrl
    ? { source: { uri: wallpaperUrl }, style: { flex: 1 }, resizeMode: "cover" as const }
    : { style: { flex: 1, backgroundColor: '#f5f5f5' } };

  return (
    <RootWrapper {...wrapperProps as any}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.groupAvatarContainer}>
              {workspaceData?.imageUrl ? (
                <Image source={{ uri: workspaceData.imageUrl }} style={styles.groupAvatar} />
              ) : (
                <View style={styles.groupAvatarPlaceholder}>
                  <Feather name="users" size={20} color="#007AFF" />
                </View>
              )}
            </View>
            <Text style={styles.headerTitle}>{name}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push({ pathname: '/workspace/invite', params: { workspaceId: id } })} style={styles.inviteButton}>
            <Feather name="user-plus" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {members.length > 0 && (
          <TouchableOpacity style={styles.membersBar} activeOpacity={0.7} onPress={() => setShowMembersModal(true)}>
            <View style={styles.membersAvatars}>
              {members.slice(0, 5).map((member) => {
                const memberData = member.userId || member;
                const isOnline = onlineUsers.includes(extractId(memberData._id));
                return (
                  <View key={extractId(memberData._id)} style={styles.memberAvatarWrapper}>
                    <UserAvatar uri={memberData.avatarUrl} size={32} />
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
            ListEmptyComponent={
              isChatLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#999', fontSize: 16, textAlign: 'center' }}>Aún no hay mensajes en este escritorio</Text>
                  <View style={{ marginTop: 10 }}><Feather name="message-square" size={32} color="#ccc" /></View>
                </View>
              )
            }
            contentContainerStyle={styles.messagesList}
            inverted={messages.length > 0}
            showsVerticalScrollIndicator={false}
          />
        )}

        <ChatInput
          content={newMessage}
          setContent={setNewMessage}
          onSend={sendMessageLocal}
          onAttach={handleAttachFile}
          isRecording={isRecording}
          onStartRecord={startRecording}
          onStopRecord={stopRecording}
          isEditing={!!editingMessage}
          onCancelEdit={() => { setEditingMessage(null); setNewMessage(''); }}
        />

        <Modal visible={!!selectedMsgOptions} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedMsgOptions(null)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Opciones del mensaje</Text>

              <TouchableOpacity style={styles.modalButton} onPress={() => {
                const msg = selectedMsgOptions!;
                setSelectedMsgOptions(null);
                router.push({
                  pathname: '/chat/message-info',
                  params: {
                    messageId: msg._id,
                    messageContent: msg.contenido || msg.content || '',
                    senderId: currentUserId,
                    chatParticipantsRaw: JSON.stringify(members || []),
                    readByRaw: JSON.stringify(msg.readBy || []),
                    deliveredToRaw: JSON.stringify(msg.deliveredTo || []),
                  }
                });
              }}>
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
                queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => {
                  if (!old) return [];
                  return old.filter(msg => msg._id !== msgId);
                });
              }}>
                <Feather name="trash" size={20} color="#FF3B30" />
                <Text style={[styles.modalButtonText, { color: '#FF3B30' }]}>Eliminar para mí</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalButton} onPress={async () => {
                const msgId = selectedMsgOptions!._id;
                setSelectedMsgOptions(null);
                await deleteMessage(msgId, 'for_all');
                queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => {
                  if (!old) return [];
                  return old.map(msg => msg._id === msgId ? { ...msg, contenido: 'Mensaje eliminado' } : msg);
                });
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
                keyExtractor={item => (item.userId || item)._id}
                renderItem={({ item }) => {
                  const memberData = item.userId || item;
                  const isOnline = onlineUsers.includes(extractId(memberData._id));
                  return (
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        setShowMembersModal(false);
                        if (String(memberData._id) !== String(currentUserId)) {
                          router.push({
                            pathname: '/user/[id]',
                            params: { id: memberData._id, name: memberData.name || memberData.username, email: memberData.email || '', avatarUrl: memberData.avatarUrl || '' }
                          });
                        }
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ marginRight: 12 }}>
                          <UserAvatar uri={memberData.avatarUrl} size={40} />
                          {isOnline && <View style={[styles.onlineDot, { right: 0, bottom: 0 }]} />}
                        </View>
                        <View>
                          <Text style={{ fontSize: 16, fontWeight: '500', color: '#333' }}>
                            {memberData.name || memberData.username || 'Usuario'}
                            {String(memberData._id) === String(currentUserId) && ' (Tú)'}
                          </Text>
                          <Text style={{ fontSize: 12, color: isOnline ? '#2E7D32' : '#999' }}>{isOnline ? 'En línea' : 'Desconectado'}</Text>
                        </View>
                      </View>
                      {String(memberData._id) !== String(currentUserId) && <Feather name="message-circle" size={20} color="#007AFF" />}
                    </TouchableOpacity>
                  );
                }}
                ListFooterComponent={() => (
                  <TouchableOpacity
                    style={[styles.modalButton, { justifyContent: 'center', marginTop: 10, borderBottomWidth: 0 }]}
                    onPress={isGroupAdmin ? handleDeleteGroup : handleLeaveGroup}
                  >
                    <Feather name={isGroupAdmin ? "trash-2" : "log-out"} size={20} color="#FF3B30" />
                    <Text style={[styles.modalButtonText, { color: '#FF3B30', fontWeight: 'bold' }]}>
                      {isGroupAdmin ? 'Eliminar Grupo' : 'Abandonar Grupo'}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </RootWrapper>
  );
}

type MessageMessageType = ChatMessageType;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { padding: 8 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginLeft: 8 },
  groupAvatarContainer: { position: 'relative', marginRight: 8 },
  groupAvatar: { width: 36, height: 36, borderRadius: 18 },
  groupAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  inviteButton: { padding: 8 },
  membersBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  membersAvatars: { flexDirection: 'row', alignItems: 'center' },
  memberAvatarWrapper: { marginRight: -6, position: 'relative' },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#fff', position: 'absolute', bottom: -2, right: -2 },
  onlineText: { fontSize: 13, color: '#888' },
  moreMembersText: { fontSize: 11, fontWeight: '600', color: '#666' },
  messagesList: { paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333', textAlign: 'center' },
  modalButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalButtonText: { fontSize: 16, marginLeft: 12, color: '#007AFF' },
});