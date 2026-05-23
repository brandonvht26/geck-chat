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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { useChatMessages } from '@/src/hooks/queries/useChatMessages';
import { useAuth } from '@/src/hooks/useAuth';
import { api } from '@/src/services/api';
import { SocketService } from '@/src/services/socket.service';
import { useSocket } from '@/src/context/SocketContext';
import { getUserChats, getChatMessages, editMessage, deleteMessage, sendAudioMessage, ChatMessage as ChatMessageType } from '@/src/services/chat.service';
import { sendFileMessage, deleteGroupChat } from '@/src/services/chat.service';
import { leaveWorkspace } from '@/src/services/workspace.service';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import MessageBubble from '@/src/components/chat/MessageBubble';
import ChatInput from '@/src/components/chat/ChatInput';

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
  const [durationText, setDurationText] = useState("0:00");

  async function playSound() {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.positionMillis === status.durationMillis) {
            await sound.setPositionAsync(0);
          }
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: fileUrl },
          { shouldPlay: true, isLooping: false }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded) {
            if (status.durationMillis) {
              const totalSeconds = Math.floor(status.durationMillis / 1000);
              const minutes = Math.floor(totalSeconds / 60);
              const seconds = totalSeconds % 60;
              setDurationText(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
              newSound.setPositionAsync(0);
              newSound.pauseAsync();
            }
          }
        });
      }
    } catch (error) {
      console.error("Error reproduciendo audio:", error);
    }
  }

  useEffect(() => {
    return () => { if (sound) { sound.unloadAsync(); } };
  }, [sound]);

  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isSent ? 'rgba(255,255,255,0.2)' : '#f0f0f0', padding: 8, borderRadius: 20, minWidth: 120 }} onPress={playSound}>
      <Feather name={isPlaying ? "pause" : "play"} size={24} color={isSent ? '#fff' : '#007AFF'} />
      <View style={{ flex: 1, height: 2, backgroundColor: isSent ? '#fff' : '#007AFF', marginHorizontal: 8 }} />
      <Text style={{ fontSize: 12, color: isSent ? '#fff' : '#666', fontWeight: '500' }}>{durationText}</Text>
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
  const startTimeRef = useRef(0);
  const hasMarkedRead = useRef(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [unreadSeparatorId, setUnreadSeparatorId] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  const { user } = useAuth();

  const queryClient = useQueryClient();
  const { data: messages = [], isLoading: isChatLoading } = useChatMessages(currentChatId);

  useEffect(() => {
    if (user) {
      setCurrentUserId(user._id);
    }
  }, [user]);

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
              flatListRef.current.scrollToIndex({
                index: foundIndex,
                animated: true,
                viewPosition: 0.1
              });
              setHasScrolled(true);
            } catch (e) {
              console.log('Fallo silencioso de scroll', e);
            }
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

  const isGroupAdmin = workspaceData?.admins?.some(
    (adminId: any) => (adminId._id || adminId) === currentUserId
  ) || workspaceData?.owner?._id === currentUserId
    || workspaceData?.owner === currentUserId;

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
        setWorkspaceData(foundChat.workspaceId || null);
        SocketService.emit('join_chat', foundChat._id);
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
    if (!currentChatId || !currentUserId || messages.length === 0 || hasMarkedRead.current) return;
    hasMarkedRead.current = true;

    queryClient.setQueryData(['userChats'], (oldChats: any[]) => {
      if (!oldChats) return oldChats;
      return oldChats.map(chat =>
        String(chat._id) === String(currentChatId)
          ? { ...chat, unreadCounts: { ...chat.unreadCounts, [currentUserId]: 0 } }
          : chat
      );
    });

    SocketService.emit('mark_read', { chatId: currentChatId, userId: currentUserId });
    api.patch(`/api/chat/${currentChatId}/read`).catch(() => {});

    setTimeout(() => {
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

  }, [currentChatId, currentUserId, queryClient, messages.length]);

  useEffect(() => {
    const handleMessageReceived = (payload: any) => {
      const incomingChatId = extractId(payload.chatId || payload.workspaceId || payload.roomId);
      if (incomingChatId === String(currentChatId)) {
        const message: MessageMessageType = {
          _id: payload._id || Date.now().toString(),
          senderId: payload.senderId,
          receiverId: payload.chatId,
          contenido: payload.content,
          createdAt: payload.createdAt,
        };

        queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => {
          if (!old) return [message];
          const exists = old.some(msg => msg._id === message._id);
          return exists ? old : [message, ...old];
        });

        // 🚀 ACUSE DE RECIBO: Si el mensaje no es mío y tengo el chat abierto, firmo como leído
        const senderStr = extractId(payload.senderId);
        if (senderStr !== String(currentUserId)) {
          SocketService.emit('mark_read', { chatId: currentChatId, userId: currentUserId });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    };

    const handleMessageStatusUpdate = (payload: any) => {
      // Sincroniza exactamente con el payload del backend: { messageId, deliveredTo, readBy }
      queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => {
        if (!old) return [];
        return old.map(msg => msg._id === payload.messageId
          ? { ...msg, deliveredTo: payload.deliveredTo, readBy: payload.readBy }
          : msg
        );
      });
    };

    const handleBulkUpdate = (payload: any) => {
      // Sincroniza múltiples mensajes (Ej. al entrar al chat) sin inyectar un status fantasma
      queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => {
        if (!old) return [];
        return old.map(msg => {
          const updatedMsg = payload.updatedMessages?.find((u: any) => u._id === msg._id);
          if (updatedMsg) {
            return {
              ...msg,
              readBy: updatedMsg.readBy || msg.readBy,
              deliveredTo: updatedMsg.deliveredTo || msg.deliveredTo
            };
          }
          return msg;
        });
      });
    };

    const handleMessageEdited = (payload: any) => {
      queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => {
        if (!old) return [];
        return old.map(msg => msg._id === payload._id 
          ? { ...msg, contenido: payload.content || payload.contenido, isEdited: true } 
          : msg
        );
      });
    };

    const handleMessageDeleted = (payload: any) => {
      queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => {
        if (!old) return [];
        return old.map(msg => msg._id === payload.messageId 
          ? { ...msg, contenido: 'Mensaje eliminado', isDeleted: true } 
          : msg
        );
      });
    };

    // Limpiamos y asignamos los listeners correctos
    SocketService.on('new_message', handleMessageReceived);
    SocketService.on('message_received', handleMessageReceived);
    SocketService.on('message_status_update', handleMessageStatusUpdate);
    SocketService.on('chat_status_bulk_update', handleBulkUpdate);
    SocketService.on('message_edited', handleMessageEdited);
    SocketService.on('message_deleted', handleMessageDeleted);

    return () => {
      SocketService.off('new_message', handleMessageReceived);
      SocketService.off('message_received', handleMessageReceived);
      SocketService.off('message_status_update', handleMessageStatusUpdate);
      SocketService.off('chat_status_bulk_update', handleBulkUpdate);
      SocketService.off('message_edited', handleMessageEdited);
      SocketService.off('message_deleted', handleMessageDeleted);
    };
  }, [currentChatId]);

  const handleLongPress = useCallback((item: MessageMessageType) => {
    const senderIdStr = typeof item.senderId === 'object' ? (item.senderId as any)._id : item.senderId;
    if (senderIdStr === currentUserId) {
      setSelectedMsgOptions(item);
    }
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

      const newMsg = await sendFileMessage(currentChatId, asset.uri, safeFileName, safeMimeType);

      queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => {
        if (!old) return [newMsg];
        return old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old];
      });
    } catch (error) {
      console.error('Error attaching file:', error);
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
        queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) =>
          old ? old.map(msg => msg._id === editingMessage._id ? updated : msg) : []
        );
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

    queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) =>
      old ? [localMsg, ...old] : [localMsg]
    );

    try {
      await api.post('/api/chat/message', msgData);
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error enviando mensaje' });
    }
  }, [newMessage, currentChatId, editingMessage, currentUserId, queryClient]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      startTimeRef.current = Date.now();
      try { require('expo-haptics').impactAsync(); } catch { }
    } catch (err) {
      console.error('Error al iniciar grabación', err);
    }
  };

  const stopRecording = async () => {
    if (!recording || !currentChatId) return;
    setIsRecording(false);
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed < 500) {
      try { await recording.stopAndUnloadAsync(); } catch { }
      setRecording(null);
      return;
    }
    try {
      try { await recording.stopAndUnloadAsync(); } catch (e) {
        setRecording(null);
        return;
      }
      const uri = recording.getURI();
      const duration = elapsed / 1000;

      setRecording(null);

      if (uri) {
        const newMsg = await sendAudioMessage(currentChatId, uri, duration);
        queryClient.setQueryData(['chatMessages', currentChatId], (old: MessageMessageType[] | undefined) => {
          if (!old) return [newMsg];
          const exists = old.some(msg => msg._id === newMsg._id);
          return exists ? old : [newMsg, ...old];
        });
      }
    } catch (error) {
      console.error('Error enviando audio grupal', error);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert('Abandonar grupo', '¿Estás seguro de que deseas salir de este grupo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => {
        try {
          await leaveWorkspace(id);
          queryClient.invalidateQueries({ queryKey: ['userChats'] });
          router.replace('/(tabs)/chats');
          Toast.show({ type: 'success', text1: 'Has salido del grupo' });
        } catch (error: any) {
          Toast.show({ type: 'error', text1: error.response?.data?.msg || 'Error al salir del grupo' });
        }
      }}
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert('Eliminar grupo', 'Esta acción es irreversible. Se borrarán todos los mensajes.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await deleteGroupChat(currentChatId!);
          queryClient.invalidateQueries({ queryKey: ['userChats'] });
          router.replace('/(tabs)/chats');
          Toast.show({ type: 'success', text1: 'Grupo eliminado correctamente' });
        } catch (error: any) {
          Toast.show({ type: 'error', text1: error.response?.data?.msg || 'Error al eliminar el grupo' });
        }
      }}
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
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/workspace/invite',
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
              const memberData = member.userId || member;
              // 2. Evaluación corregida con extractId
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
                <Text style={{ color: '#999', fontSize: 16, textAlign: 'center' }}>
                  Aún no hay mensajes en este escritorio
                </Text>
                <View style={{ marginTop: 10 }}>
                  <Feather name="message-square" size={32} color="#ccc" />
                </View>
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
        onSend={sendMessage}
        onAttach={handleAttachFile}
        isRecording={isRecording}
        onStartRecord={startRecording}
        onStopRecord={stopRecording}
        isEditing={!!editingMessage}
        onCancelEdit={() => { setEditingMessage(null); setNewMessage(''); }}
      />
      <Toast />

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
                          params: { id: memberData._id, name: memberData.name || memberData.username, email: memberData.email || '' }
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
                        <Text style={{ fontSize: 12, color: isOnline ? '#2E7D32' : '#999' }}>
                          {isOnline ? 'En línea' : 'Desconectado'}
                        </Text>
                      </View>
                    </View>
                    {String(memberData._id) !== String(currentUserId) && (
                      <Feather name="message-circle" size={20} color="#007AFF" />
                    )}
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
  groupAvatarContainer: {
    position: 'relative',
    marginRight: 8,
  },
  groupAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  groupAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
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
