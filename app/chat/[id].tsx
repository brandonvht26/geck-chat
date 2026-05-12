import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
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

const AudioPlayer = ({ fileUrl, isMyMessage }: { fileUrl: string, isMyMessage: boolean }) => {
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
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isMyMessage ? 'rgba(255,255,255,0.2)' : '#f0f0f0', padding: 8, borderRadius: 20, width: 150 }} 
      onPress={playSound}
    >
      <Feather name={isPlaying ? "pause" : "play"} size={24} color={isMyMessage ? '#fff' : '#007AFF'} />
      <View style={{ flex: 1, height: 2, backgroundColor: isMyMessage ? '#fff' : '#007AFF', marginLeft: 8 }} />
    </TouchableOpacity>
  );
};

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const [content, setContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [selectedMsgOptions, setSelectedMsgOptions] = useState<any | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const queryClient = useQueryClient();
  const { data: messages = [] } = useChatMessages(id as string);

  useEffect(() => {
    if (user) {
      setCurrentUserId(user._id);
    }
  }, [user]);

  useEffect(() => {
    if (id) {
      SocketService.emit('join_chat', id as string);
    }
    return () => {
      if (id) {
        SocketService.emit('leave_chat', id as string);
      }
    };
  }, [id]);

  useEffect(() => {
    if (id && currentUserId) {
      SocketService.emit('message_read', { chatId: id, userId: currentUserId });
    }
  }, [id, currentUserId]);

  useEffect(() => {
    const handleNewMessage = (newMessage: ChatMessage) => {
      const chatId = (newMessage as any).chatId || (newMessage as any).workspaceId || (newMessage as any).roomId;
      if (chatId?.toString() !== id?.toString()) return;
      
      queryClient.setQueryData(['chatMessages', id], (oldData: ChatMessage[] | undefined) => {
        if (!oldData) return [newMessage];
        const exists = oldData.some(msg => msg._id === newMessage._id);
        return exists ? oldData : [newMessage, ...oldData];
      });
    };

    const handleStatusUpdate = (payload: any) => {
      queryClient.setQueryData(['chatMessages', id], (oldData: ChatMessage[] | undefined) => {
        if (!oldData) return [];
        return oldData.map(m => m._id === payload.messageId ? { ...m, status: payload.status } : m);
      });
    };

    const handleChatRead = (payload: any) => {
      queryClient.setQueryData(['chatMessages', id], (oldData: ChatMessage[] | undefined) => {
        if (!oldData) return [];
        return oldData.map(m => (m as any).chatId === payload.chatId ? { ...m, status: 'read' } : m);
      });
    };

    SocketService.on('receive_message', handleNewMessage);
    SocketService.on('message_status_update', handleStatusUpdate);
    SocketService.on('chat_read', handleChatRead);

    return () => {
      SocketService.off('receive_message', handleNewMessage);
      SocketService.off('message_status_update', handleStatusUpdate);
      SocketService.off('chat_read', handleChatRead);
    };
  }, [id]);

  const handleSendMessage = async () => {
    const cleanedMessage = content.trim();
    if (!cleanedMessage || !id) return;
    
    try {
      if (editingMessage) {
        const updatedMsg = await editMessage(editingMessage._id, cleanedMessage);
        queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => 
          old ? old.map(m => m._id === editingMessage._id ? { ...m, content: updatedMsg.content || updatedMsg.contenido } : m) : []
        );
        setEditingMessage(null);
      } else {
        const newMsg = await sendMessage(id as string, cleanedMessage);
        queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
          if (!old) return [newMsg];
          const exists = old.some(msg => msg._id === newMsg._id);
          return exists ? old : [newMsg, ...old];
        });
      }
      setContent('');
    } catch (error) {
      console.error('Error enviando/editando mensaje:', error);
    }
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const newMsg = await sendFileMessage(id as string, asset.uri, asset.name, asset.mimeType);
      queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
        if (!old) return [newMsg];
        const exists = old.some(msg => msg._id === newMsg._id);
        return exists ? old : [newMsg, ...old];
      });
    } catch (error) {
      console.error('Error attaching file:', error);
    }
  };

  const handleOpenFile = async (message: ChatMessage) => {
    try {
      const msg = message as any;
      const fileName: string = msg.content || msg.contenido || '';
      const originalExtension = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '';
      const nameWithoutExtension = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
      const baseName = nameWithoutExtension.replace(/[^a-zA-Z0-9]/g, '_');
      const safeFileName = `${baseName}${originalExtension}`;
      const fileUri = `${FileSystem.documentDirectory}${safeFileName}`;

      const cachedFileInfo = await FileSystem.getInfoAsync(fileUri);

      if (cachedFileInfo.exists) {
        const shareUri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;
        await Sharing.shareAsync(shareUri, { UTI: 'public.item' });
      } else {
        await FileSystem.downloadAsync(msg.fileUrl, fileUri);
        const shareUri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;
        await Sharing.shareAsync(shareUri, { UTI: 'public.item' });
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const handleLongPress = (item: any) => {
    const sender = item.senderId;
    const senderId = typeof sender === 'object' ? sender?._id : sender;
    if (senderId === currentUserId) {
      setSelectedMsgOptions(item);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const duration = status.durationMillis / 1000;

      setRecording(null);

      if (uri && id) {
        const newMsg = await sendAudioMessage(id as string, uri, duration);
        queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
          if (!old) return [newMsg];
          const exists = old.some(msg => msg._id === newMsg._id);
          return exists ? old : [newMsg, ...old];
        });
      }
    } catch (error) {
      console.error('Error enviando audio', error);
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
          const msg = item as any;
          const sender = msg.senderId;
          const senderId = typeof sender === 'object' ? sender?._id : sender;
          const senderName = typeof sender === 'object' ? (sender?.name || sender?.username || 'Usuario') : 'Usuario';
          const isMyMessage = senderId === currentUserId;
          const isExpired = (msg.type === 'file' || msg.type === 'audio') && (!msg.fileUrl || msg.content === 'Archivo expirado');

          if (isExpired) {
            return (
              <TouchableOpacity onPress={() => Alert.alert('Archivo expirado', 'Este archivo ha superado el límite de 24 horas y fue eliminado del servidor por seguridad.')} style={[styles.messageBubble, isMyMessage ? styles.myMessageExpired : styles.otherMessageExpired]}>
                <Ionicons name="document-outline" size={24} color="gray" />
                <Text style={styles.expiredText}>Archivo no disponible / expirado</Text>
              </TouchableOpacity>
            );
          }

          if (msg.type === 'audio') {
            return (
              <TouchableOpacity onLongPress={() => handleLongPress(item)} style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
                <AudioPlayer fileUrl={msg.fileUrl} isMyMessage={isMyMessage} />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
                  <Text style={[styles.messageTime, isMyMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: '#999' }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }

          if (msg.type === 'file') {
            return (
              <TouchableOpacity onPress={() => handleOpenFile(item)} style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
                <Text style={styles.fileIcon}>📄</Text>
                <Text style={[styles.fileName, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                  {msg.content || msg.contenido}
                </Text>
              </TouchableOpacity>
            );
          }

          const isOnline = onlineUsers.includes(senderId);
          const messageStatus = (item as any).status;
          const checkIcon = messageStatus === 'read' ? 'checkmark-done' : 'checkmark';
          const checkColor = messageStatus === 'read' ? '#34b7f1' : (isMyMessage ? 'rgba(255,255,255,0.7)' : '#999');

          return (
            <TouchableOpacity
              onLongPress={() => handleLongPress(item)}
              style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}
            >
              <View style={{ flex: 1 }}>
                {!isMyMessage && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.senderName}>{senderName}</Text>
                    {isOnline && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759', marginLeft: 6 }} />
                    )}
                  </View>
                )}
                <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                  {item.content || item.contenido}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 4 }}>
                  <Text style={[styles.messageTime, isMyMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: '#999' }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </Text>
                  {isMyMessage && (
                    <Ionicons name={checkIcon} size={16} color={checkColor} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.messagesContainer}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={handleAttachFile}>
          <Text style={styles.attachButtonText}>Adjuntar</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="Escribe un mensaje..."
          multiline
        />
        {content.trim().length > 0 ? (
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendButtonText}>Enviar</Text>
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

      <Modal visible={!!selectedMsgOptions} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedMsgOptions(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Opciones del mensaje</Text>

            <TouchableOpacity style={styles.modalButton} onPress={() => {
              setEditingMessage(selectedMsgOptions);
              setContent(selectedMsgOptions!.content || selectedMsgOptions!.contenido);
              setSelectedMsgOptions(null);
            }}>
              <Feather name="edit-2" size={20} color="#007AFF" />
              <Text style={styles.modalButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={async () => {
              const msgId = selectedMsgOptions!._id;
              setSelectedMsgOptions(null);
              await deleteMessage(msgId, 'for_me');
              queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
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
              queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
                if (!old) return [];
                return old.map(msg => msg._id === msgId ? { ...msg, content: 'Mensaje eliminado', isDeleted: true } : msg);
              });
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  messageTime: {
    fontSize: 11,
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
  fileIcon: {
    fontSize: 24,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  myMessageExpired: {
    backgroundColor: '#b0b0b0',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessageExpired: {
    backgroundColor: '#d0d0d0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  expiredText: {
    fontSize: 13,
    color: 'gray',
    fontStyle: 'italic',
    flexShrink: 1,
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
