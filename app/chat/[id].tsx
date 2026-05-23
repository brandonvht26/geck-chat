import { useEffect, useState, useRef } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, Alert, Modal, TouchableOpacity, Text, StyleSheet, ActivityIndicator, ImageBackground } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useQueryClient } from '@tanstack/react-query';
import { useChatMessages } from '@/src/hooks/queries/useChatMessages';
import { sendMessage, sendFileMessage, sendAudioMessage, editMessage, deleteMessage, ChatMessage } from '@/src/services/chat.service';
import { SocketService } from '@/src/services/socket.service';
import { useAuth } from '@/src/hooks/useAuth';
import { useSocket } from '@/src/context/SocketContext';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import MessageBubble from '@/src/components/chat/MessageBubble';
import ChatInput from '@/src/components/chat/ChatInput';
import { useUserChats } from '@/src/hooks/queries/useUserChats';
import { api } from '@/src/services/api';

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

export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { data: messages = [], isLoading } = useChatMessages(id as string);
  const [content, setContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const { data: chats } = useUserChats();
  const currentChat = chats?.find(c => c._id === id);
  const otherUser = currentChat?.isGroup ? null : currentChat?.participants?.find(
    (p: any) => (p?._id || p) !== user?._id
  );
  const isOtherOnline = onlineUsers.includes(otherUser?._id || '');
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [selectedMsgOptions, setSelectedMsgOptions] = useState<any | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const startTimeRef = useRef(0);
  const hasMarkedRead = useRef(false);
  const [unreadSeparatorId, setUnreadSeparatorId] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => { if (user) setCurrentUserId(user._id); }, [user]);

  useEffect(() => {
    if (id) SocketService.emit('join_chat', id as string);
    return () => { if (id) SocketService.emit('leave_chat', id as string); };
  }, [id]);

  useEffect(() => {
    if (!id || !currentUserId || messages.length === 0 || hasMarkedRead.current) return;
    hasMarkedRead.current = true;

    queryClient.setQueryData(['userChats'], (oldChats: any[]) => {
      if (!oldChats) return oldChats;
      return oldChats.map(chat =>
        String(chat._id) === String(id)
          ? { ...chat, unreadCounts: { ...chat.unreadCounts, [currentUserId]: 0 } }
          : chat
      );
    });

    SocketService.emit('mark_read', { chatId: id, userId: currentUserId });
    api.patch(`/api/chat/${id}/read`).catch(() => {});

    const timer = setTimeout(() => {
      queryClient.setQueryData(['chatMessages', id], (oldMessages: any[]) => {
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

  }, [id, currentUserId, queryClient, messages.length]);

  useEffect(() => {
    if (!id || !currentUserId) return;

    const handleMessageReceived = (payload: any) => {
      const incomingChatId = extractId(payload.chatId || payload.workspaceId || payload.roomId);
      if (incomingChatId !== String(id)) return;

      const message: ChatMessage = {
        _id: payload._id || Date.now().toString(),
        senderId: payload.senderId,
        receiverId: payload.chatId,
        contenido: payload.content,
        createdAt: payload.createdAt,
      } as ChatMessage;

      queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
        if (!old) return [message];
        const exists = old.some(msg => msg._id === message._id);
        return exists ? old : [message, ...old];
      });

      const senderStr = extractId(payload.senderId);
      if (senderStr !== String(currentUserId)) {
        SocketService.emit('mark_read', { chatId: id, userId: currentUserId });
      }

      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    };

    const handleMessageStatusUpdate = (payload: any) => {
      queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
        if (!old) return [];
        return old.map(msg => msg._id === payload.messageId
          ? { ...msg, deliveredTo: payload.deliveredTo, readBy: payload.readBy }
          : msg
        );
      });
    };

    const handleBulkUpdate = (payload: any) => {
      queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
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
      queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
        if (!old) return [];
        return old.map(msg => msg._id === payload._id
          ? { ...msg, contenido: payload.content || payload.contenido, isEdited: true }
          : msg
        );
      });
    };

    const handleMessageDeleted = (payload: any) => {
      queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
        if (!old) return [];
        return old.map(msg => msg._id === payload.messageId
          ? { ...msg, contenido: 'Mensaje eliminado', isDeleted: true }
          : msg
        );
      });
    };

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
  }, [id, queryClient, currentUserId]);

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

  const handleSendMessage = async () => {
    const cleanedMessage = content.trim();
    if (!cleanedMessage || !id) return;
    try {
      if (editingMessage) {
        const updatedMsg = await editMessage(editingMessage._id, cleanedMessage);
        SocketService.emit('edit_message', { messageId: editingMessage._id, senderId: currentUserId, content: cleanedMessage });
        queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? old.map(m => m._id === editingMessage._id ? { ...m, content: updatedMsg.content || updatedMsg.contenido } : m) : []);
        setEditingMessage(null);
        queryClient.invalidateQueries({ queryKey: ['userChats'] });
      } else {
        const newMsg = await sendMessage(id as string, cleanedMessage);
        queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? (old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old]) : [newMsg]);
      }
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    } catch (error) { console.error('Error enviando/editando mensaje:', error); }
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      
      const asset = result.assets[0];
      
      // Validación de tamaño (Límite 5MB)
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('Archivo muy pesado', 'Por favor, selecciona un archivo menor a 5MB.');
        return;
      }

      // Limpieza de propiedades para evitar que el backend colapse (Error 500)
      const safeFileName = asset.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const safeMimeType = asset.mimeType || 'application/octet-stream';

      const newMsg = await sendFileMessage(id as string, asset.uri, safeFileName, safeMimeType);
      
      queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
        if (!old) return [newMsg];
        return old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    } catch (error) { 
      console.error('Error attaching file:', error); 
      Alert.alert('Error', 'No se pudo adjuntar el archivo al chat.');
    }
  };

  const handleOpenFile = async (item: any) => {
    try {
      const fileName: string = item.content || item.contenido || '';
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${safeFileName}`;
      const cachedFileInfo = await FileSystem.getInfoAsync(fileUri);
      if (cachedFileInfo.exists) { await Sharing.shareAsync(fileUri, { UTI: 'public.item' }); } 
      else { await FileSystem.downloadAsync(item.fileUrl, fileUri); await Sharing.shareAsync(fileUri, { UTI: 'public.item' }); }
    } catch (error) { console.error('Error opening file:', error); }
  };

  const handleLongPress = (item: any) => {
    const senderId = typeof item.senderId === 'object' ? item.senderId?._id : item.senderId;
    if (senderId === currentUserId) setSelectedMsgOptions(item);
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording); setIsRecording(true);
      startTimeRef.current = Date.now();
      try { require('expo-haptics').impactAsync(); } catch {}
    } catch (err) { console.error('Failed to start recording', err); }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed < 500) {
      try { await recording.stopAndUnloadAsync(); } catch {}
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
      if (uri && id) {
        const newMsg = await sendAudioMessage(id as string, uri, duration);
        queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? (old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old]) : [newMsg]);
      }
    } catch (error) { console.error('Error enviando audio', error); }
  };

  // Lógica de Wrapper Dinámico
  const wallpaperUrl = user?.preferences?.phoneWallpaperUrl;
  const RootWrapper = wallpaperUrl ? ImageBackground : (View as any);
  const wrapperProps = wallpaperUrl
    ? { source: { uri: wallpaperUrl }, style: { flex: 1 }, resizeMode: "cover" as const }
    : { style: { flex: 1, backgroundColor: '#f5f5f5' } };

  return (
    <RootWrapper {...wrapperProps as any}>
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTransparent: true,
          headerBlurEffect: 'dark',
          headerTitle: '',
          headerLeft: () => {
            const avatarSrc = otherUser?.avatarUrl || otherUser?.userId?.avatarUrl;
            const displayName = otherUser?.name || otherUser?.userId?.name || 'Usuario';

            return (
              <View className="flex-row items-center gap-3 pl-2" style={{ paddingTop: Platform.OS === 'android' ? 30 : 0 }}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <UserAvatar uri={avatarSrc} size={38} />
                <View>
                  <Text className="text-white font-semibold text-base">
                    {displayName}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {isOtherOnline ? 'En línea' : 'Desconectado'}
                  </Text>
                </View>
              </View>
            );
          },
          headerStyle: { backgroundColor: 'rgba(0,0,0,0.4)' },
        }}
      />
      <KeyboardAvoidingView style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        ref={flatListRef}
        data={messages}
        inverted={messages.length > 0}
        keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}
        ListEmptyComponent={
          isLoading ? (
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
        renderItem={({ item }) => {
          const senderId = typeof item.senderId === 'object' ? (item.senderId as any)?._id : item.senderId;
          const isMe = senderId === currentUserId;
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
                isMe={isMe}
                senderName={typeof item.senderId === 'object' && item.senderId !== null ? (item.senderId as any)?.name : 'Usuario'}
                isOnline={onlineUsers.includes(senderId)}
                onLongPress={handleLongPress}
                onOpenFile={handleOpenFile}
                totalParticipants={currentChat?.isGroup ? (currentChat?.participants?.length || 0) : 2}
                AudioPlayerComponent={AudioPlayer}
                isGroupChat={currentChat?.isGroup || false}
                chatParticipants={currentChat?.participants || []}
              />
            </View>
          );
        }}
      />
      <ChatInput
        content={content}
        setContent={setContent}
        onSend={handleSendMessage}
        onAttach={handleAttachFile}
        isRecording={isRecording}
        onStartRecord={startRecording}
        onStopRecord={stopRecording}
        isEditing={!!editingMessage}
        onCancelEdit={() => { setEditingMessage(null); setContent(''); }}
      />
      <Modal visible={!!selectedMsgOptions} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedMsgOptions(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Opciones del mensaje</Text>
            {!selectedMsgOptions?.isDeleted && (
              <>
                <TouchableOpacity style={styles.modalButton} onPress={() => { setEditingMessage(selectedMsgOptions); setContent(selectedMsgOptions!.content || selectedMsgOptions!.contenido); setSelectedMsgOptions(null); }}>
                  <Feather name="edit-2" size={20} color="#007AFF" />
                  <Text style={styles.modalButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={async () => {
                  const msgId = selectedMsgOptions!._id; setSelectedMsgOptions(null); await deleteMessage(msgId, 'for_all');
                  SocketService.emit('delete_message', { messageId: msgId, userId: currentUserId, type: 'for_all' });
                  queryClient.invalidateQueries({ queryKey: ['userChats'] });
                  queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? old.map(msg => msg._id === msgId ? { ...msg, content: 'Mensaje eliminado', isDeleted: true } : msg) : []);
                }}>
                  <Feather name="trash-2" size={20} color="#FF3B30" />
                  <Text style={[styles.modalButtonText, { color: '#FF3B30' }]}>Eliminar para todos</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.modalButton} onPress={async () => {
              const msgId = selectedMsgOptions!._id; setSelectedMsgOptions(null); await deleteMessage(msgId, 'for_me');
              queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? old.filter(msg => msg._id !== msgId) : []);
            }}>
              <Feather name="trash" size={20} color="#FF3B30" />
              <Text style={[styles.modalButtonText, { color: '#FF3B30' }]}>Eliminar para mí</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
       </Modal>
      </KeyboardAvoidingView>
    </RootWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333', textAlign: 'center' },
  modalButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalButtonText: { fontSize: 16, marginLeft: 12, color: '#007AFF' },
});
