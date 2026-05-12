import { useEffect, useState, useRef } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, Alert, Modal, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useQueryClient } from '@tanstack/react-query';
import { useChatMessages } from '@/src/hooks/queries/useChatMessages';
import { sendMessage, sendFileMessage, sendAudioMessage, editMessage, deleteMessage, ChatMessage } from '@/src/services/chat.service';
import { SocketService } from '@/src/services/socket.service';
import { useAuth } from '@/src/hooks/useAuth';
import { useSocket } from '@/src/context/SocketContext';
import MessageBubble from '@/src/components/chat/MessageBubble';
import ChatInput from '@/src/components/chat/ChatInput';

const AudioPlayer = ({ fileUrl, isSent }: { fileUrl: string, isSent: boolean }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationText, setDurationText] = useState("0:00");

  async function playSound() {
    if (sound) {
      if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); } 
      else { await sound.playAsync(); setIsPlaying(true); }
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUrl }, 
        { shouldPlay: true, isLooping: false }
      );
      setSound(newSound); setIsPlaying(true);
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
          }
        }
      });
    }
  }
  useEffect(() => { return sound ? () => { sound.unloadAsync(); } : undefined; }, [sound]);
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isSent ? 'rgba(255,255,255,0.2)' : '#f0f0f0', padding: 8, borderRadius: 20, minWidth: 120 }} onPress={playSound}>
      <Feather name={isPlaying ? "pause" : "play"} size={24} color={isSent ? '#fff' : '#007AFF'} />
      <View style={{ flex: 1, height: 2, backgroundColor: isSent ? '#fff' : '#007AFF', marginHorizontal: 8 }} />
      <Text style={{ fontSize: 12, color: isSent ? '#fff' : '#666', fontWeight: '500' }}>{durationText}</Text>
    </TouchableOpacity>
  );
};

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { data: messages = [], isLoading } = useChatMessages(id as string);
  const [content, setContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [selectedMsgOptions, setSelectedMsgOptions] = useState<any | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const startTimeRef = useRef(0);

  useEffect(() => { if (user) setCurrentUserId(user._id); }, [user]);

  useEffect(() => {
    if (id) SocketService.emit('join_chat', id as string);
    return () => { if (id) SocketService.emit('leave_chat', id as string); };
  }, [id]);

  useEffect(() => {
    if (id && currentUserId) SocketService.emit('message_read', { chatId: id, userId: currentUserId });
  }, [id, currentUserId]);

  useEffect(() => {
    const handleNewMessage = (newMessage: ChatMessage) => {
      const chatId = (newMessage as any).chatId || (newMessage as any).workspaceId || (newMessage as any).roomId;
      if (chatId?.toString() !== id?.toString()) return;
      queryClient.setQueryData(['chatMessages', id], (oldData: ChatMessage[] | undefined) => {
        if (!oldData) return [newMessage];
        return oldData.some(msg => msg._id === newMessage._id) ? oldData : [newMessage, ...oldData];
      });
    };
    const handleStatusUpdate = (payload: any) => {
      queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? old.map(m => m._id === payload.messageId ? { ...m, status: payload.status } : m) : []);
    };
    const handleChatRead = (payload: any) => {
      queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? old.map(m => (m as any).chatId === payload.chatId ? { ...m, status: 'read' } : m) : []);
    };
    SocketService.on('receive_message', handleNewMessage);
    SocketService.on('message_status_update', handleStatusUpdate);
    SocketService.on('chat_read', handleChatRead);
    return () => {
      SocketService.off('receive_message', handleNewMessage);
      SocketService.off('message_status_update', handleStatusUpdate);
      SocketService.off('chat_read', handleChatRead);
    };
  }, [id, queryClient]);

  const handleSendMessage = async () => {
    const cleanedMessage = content.trim();
    if (!cleanedMessage || !id) return;
    try {
      if (editingMessage) {
        const updatedMsg = await editMessage(editingMessage._id, cleanedMessage);
        queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? old.map(m => m._id === editingMessage._id ? { ...m, content: updatedMsg.content || updatedMsg.contenido } : m) : []);
        setEditingMessage(null);
      } else {
        const newMsg = await sendMessage(id as string, cleanedMessage);
        queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? (old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old]) : [newMsg]);
      }
      setContent('');
    } catch (error) { console.error('Error enviando/editando mensaje:', error); }
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      const newMsg = await sendFileMessage(id as string, asset.uri, asset.name, asset.mimeType);
      queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? (old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old]) : [newMsg]);
    } catch (error) { console.error('Error attaching file:', error); }
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

  const renderEmpty = () => {
    if (isLoading) return <View style={[styles.emptyContainer, { transform: [{ scaleY: -1 }] }]}><ActivityIndicator size="large" color="#007AFF" /></View>;
    return (
      <View style={[styles.emptyContainer, { transform: [{ scaleY: -1 }] }]}>
        <Feather name="message-square" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Aún no hay mensajes en este escritorio</Text>
      </View>
    );
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        ref={flatListRef}
        data={messages}
        inverted={true}
        keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => {
          const senderId = typeof item.senderId === 'object' ? (item.senderId as any)?._id : item.senderId;
          const isMe = senderId === currentUserId;
          const messageStatus = (item as any).status;
          return (
            <MessageBubble
              item={item}
              isMe={isMe}
              senderName={typeof item.senderId === 'object' ? (item.senderId as any)?.name : 'Usuario'}
              isOnline={onlineUsers.includes(senderId)}
              onLongPress={handleLongPress}
              onOpenFile={handleOpenFile}
              checkIcon={messageStatus === 'read' ? 'checkmark-done' : 'checkmark'}
              checkColor={messageStatus === 'read' ? '#34b7f1' : (isMe ? 'rgba(255,255,255,0.7)' : '#999')}
              AudioPlayerComponent={AudioPlayer}
            />
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
            <TouchableOpacity style={styles.modalButton} onPress={() => { setEditingMessage(selectedMsgOptions); setContent(selectedMsgOptions!.content || selectedMsgOptions!.contenido); setSelectedMsgOptions(null); }}>
              <Feather name="edit-2" size={20} color="#007AFF" />
              <Text style={styles.modalButtonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={async () => {
              const msgId = selectedMsgOptions!._id; setSelectedMsgOptions(null); await deleteMessage(msgId, 'for_me');
              queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? old.filter(msg => msg._id !== msgId) : []);
            }}>
              <Feather name="trash" size={20} color="#FF3B30" />
              <Text style={[styles.modalButtonText, { color: '#FF3B30' }]}>Eliminar para mí</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={async () => {
              const msgId = selectedMsgOptions!._id; setSelectedMsgOptions(null); await deleteMessage(msgId, 'for_all');
              queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? old.map(msg => msg._id === msgId ? { ...msg, content: 'Mensaje eliminado', isDeleted: true } : msg) : []);
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333', textAlign: 'center' },
  modalButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalButtonText: { fontSize: 16, marginLeft: 12, color: '#007AFF' },
});
