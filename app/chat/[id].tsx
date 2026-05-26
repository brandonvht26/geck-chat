import { useEffect, useState, useRef } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, Alert, Modal, Pressable, Text, ActivityIndicator, ImageBackground, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingOptions } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { toast } from 'sonner-native';
import { useQueryClient } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useChatMessages } from '@/src/hooks/queries/useChatMessages';
import { sendMessage, sendFileMessage, sendAudioMessage, editMessage, deleteMessage, ChatMessage } from '@/src/services/chat.service';
import { SocketService } from '@/src/services/socket.service';
import { useAuth } from '@/src/hooks/useAuth';
import { useSocket } from '@/src/context/SocketContext';
import { useChatSocket } from '@/src/hooks/useChatSocket'; 
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import MessageBubble from '@/src/components/chat/MessageBubble';
import ChatInput from '@/src/components/chat/ChatInput';
import { useUserChats } from '@/src/hooks/queries/useUserChats';
import { api } from '@/src/services/api';
import AudioPlayer from '@/src/components/chat/AudioPlayer';

const extractId = (obj: any): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object' && obj._id) return String(obj._id);
  return String(obj);
};

const audioOptions: any = {
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 2,
  bitRate: 128000,
};

const bundledWallpapers: Record<string, any> = {
  primary: require('../../assets/wallpapers/primary.webp'),
  secondary: require('../../assets/wallpapers/secondary.webp'),
  tertiary: require('../../assets/wallpapers/tertiary.webp'),
};

const AnimatedMenuRow = ({ icon, title, onPress, danger }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { colorScheme } = useColorScheme();
  const iconColor = danger ? '#E14B4B' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280');
  const textColor = danger ? 'text-warning dark:text-warning-dark' : 'text-textMain dark:text-textMain-dark';

  return (
    <Animated.View style={animatedStyle} className="w-full">
      <Pressable
        onPressIn={() => scale.value = withSpring(0.96, { damping: 15 })}
        onPressOut={() => scale.value = withSpring(1, { damping: 15 })}
        onPress={onPress}
        className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-zinc-800/60"
      >
        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${danger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-zinc-800'}`}>
            <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text className={`flex-1 text-base font-nunito-bold ${textColor}`}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
};

export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
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
  
  const audioRecorder = useAudioRecorder(audioOptions);
  const [isRecording, setIsRecording] = useState(false);
  const startTimeRef = useRef(0);
  
  const hasMarkedRead = useRef(false);
  const [unreadSeparatorId, setUnreadSeparatorId] = useState<string | null>(null);

  useEffect(() => { if (user) setCurrentUserId(user._id); }, [user]);

  useChatSocket({ chatId: id as string, currentUserId: currentUserId });

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
            return { ...msg, readBy: [...(msg.readBy || []), currentUserId], deliveredTo: [...(msg.deliveredTo || []), currentUserId] };
          }
          return msg;
        });
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [id, currentUserId, queryClient, messages.length]);

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
      } else {
        setUnreadSeparatorId('none');
      }
    }
  }, [messages.length, currentUserId, unreadSeparatorId]);

  const handleSendMessage = async () => {
    const cleanedMessage = content.trim();
    if (!cleanedMessage || !id) return;
    try {
      if (editingMessage) {
        const updatedMsg = await editMessage(editingMessage._id, cleanedMessage);
        SocketService.emit('edit_message', { messageId: editingMessage._id, senderId: currentUserId, content: cleanedMessage });
        queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? old.map(m => m._id === editingMessage._id ? { ...m, content: updatedMsg.content || updatedMsg.contenido } : m) : []);
        setEditingMessage(null);
      } else {
        const newMsg = await sendMessage(id as string, cleanedMessage);
        queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? (old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old]) : [newMsg]);
      }
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    } catch (error) { toast.error('Error enviando mensaje'); }
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > 5 * 1024 * 1024) return Alert.alert('Archivo muy pesado', 'Por favor, selecciona un archivo menor a 5MB.');

      const safeFileName = asset.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const safeMimeType = asset.mimeType || 'application/octet-stream';

      const newMsg = await sendFileMessage(id as string, asset.uri, safeFileName, safeMimeType);
      
      queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => {
        if (!old) return [newMsg];
        return old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    } catch (error) { toast.error('No se pudo adjuntar el archivo'); }
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

  // 🚀 Lógica Acorazada de Grabación
  const startRecording = async () => {
    try {
      await audioRecorder.record();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      try { require('expo-haptics').impactAsync(); } catch {}
    } catch (err) { toast.error('Error al iniciar el micrófono'); }
  };

  const cancelRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    try {
      await audioRecorder.stop();
    } catch (error) { console.error('Cancel error', error); }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    const elapsed = Date.now() - startTimeRef.current;
    
    try {
      await audioRecorder.stop();
      await new Promise(resolve => setTimeout(resolve, 300)); // Espera para que se guarde el archivo en disco

      if (elapsed < 800) {
        toast.info('Audio muy corto', { description: 'Mantén presionado o graba más tiempo.' });
        return; 
      }
      
      const uri = audioRecorder.uri;
      if (uri && id) {
        const duration = elapsed / 1000;
        const newMsg = await sendAudioMessage(id as string, uri, duration);
        queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? (old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old]) : [newMsg]);
      }
    } catch (error: any) { 
      toast.error('Error enviando nota de voz', { description: error.response?.data?.msg || 'Puede que el formato no sea soportado.' }); 
    }
  };

  const userWallpaper = user?.preferences?.phoneWallpaperUrl;
  const wallpaperStr = userWallpaper ? userWallpaper : 'bundled:primary';
  const isBundled = wallpaperStr.startsWith('bundled:');
  const imageSource = isBundled 
    ? bundledWallpapers[wallpaperStr.split(':')[1] as keyof typeof bundledWallpapers] 
    : { uri: wallpaperStr };

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      
      {/* 🚀 Cabecera Personalizada Pixel-Perfect */}
      <View style={{ paddingTop: insets.top }} className="bg-white dark:bg-authEnd-dark z-20 border-b border-gray-100 dark:border-zinc-800 shadow-sm">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center flex-1">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2 mr-2 active:opacity-60">
              <Feather name="arrow-left" size={24} color={colorScheme === 'dark' ? '#E5E7EB' : '#141E30'} />
            </Pressable>
            
            <Pressable 
              className="flex-row items-center flex-1"
              onPress={() => router.push({ pathname: '/user/[id]', params: { id: otherUser?._id, name: otherUser?.name, email: otherUser?.email, avatarUrl: otherUser?.avatarUrl || otherUser?.profilePicture } })}
            >
              <UserAvatar uri={otherUser?.avatarUrl || otherUser?.profilePicture} size={40} />
              <View className="ml-3 flex-1">
                <Text className="text-lg font-snpro-bold text-textMain dark:text-textMain-dark" numberOfLines={1}>
                  {otherUser?.name || otherUser?.username || 'Usuario'}
                </Text>
                <Text className="text-xs font-nunito-regular text-gray-500 dark:text-gray-400">
                  {isOtherOnline ? 'En línea' : 'Desconectado'}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
      >
        <ImageBackground source={imageSource as any} resizeMode="cover" style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted={messages.length > 0}
            keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
            contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: Math.max(insets.bottom, 16) }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              isLoading ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" className="text-primary dark:text-primary-dark" />
                </View>
              ) : (
                <View className="flex-1 justify-center items-center px-8">
                  <View className="w-20 h-20 rounded-full bg-gray-50 dark:bg-zinc-800/80 justify-center items-center mb-6">
                    <Feather name="message-square" size={32} color={colorScheme === 'dark' ? '#9CA3AF' : '#D1D5DB'} />
                  </View>
                  <Text className="text-center text-lg font-nunito-bold text-gray-400 dark:text-gray-500">
                    Comienza la conversación
                  </Text>
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
                        <Text className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">Mensajes no leídos</Text>
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
            onCancelRecord={cancelRecording}
            isEditing={!!editingMessage}
            onCancelEdit={() => { setEditingMessage(null); setContent(''); }}
          />
        </ImageBackground>
      </KeyboardAvoidingView>

      {/* 🚀 Modal Bottom Sheet de Opciones */}
      <Modal visible={!!selectedMsgOptions} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setSelectedMsgOptions(null)}>
          <Pressable 
            className="bg-white dark:bg-authEnd-dark rounded-t-3xl px-6 pt-6 pb-10" 
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full self-center mb-6" />
            <Text className="text-xl font-snpro-bold text-textMain dark:text-textMain-dark text-center mb-4">
              Opciones del mensaje
            </Text>

            {!selectedMsgOptions?.isDeleted && (
              <AnimatedMenuRow 
                icon="create-outline" title="Editar mensaje" 
                onPress={() => { setEditingMessage(selectedMsgOptions); setContent(selectedMsgOptions!.content || selectedMsgOptions!.contenido); setSelectedMsgOptions(null); }} 
              />
            )}
            
            <AnimatedMenuRow 
                icon="trash-outline" title="Eliminar para mí" danger={true}
                onPress={async () => {
                  const msgId = selectedMsgOptions!._id; setSelectedMsgOptions(null); await deleteMessage(msgId, 'for_me');
                  queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? old.filter(msg => msg._id !== msgId) : []);
                }} 
            />

            {!selectedMsgOptions?.isDeleted && (
              <AnimatedMenuRow 
                  icon="trash-bin-outline" title="Eliminar para todos" danger={true}
                  onPress={async () => {
                    const msgId = selectedMsgOptions!._id; setSelectedMsgOptions(null); await deleteMessage(msgId, 'for_all');
                    SocketService.emit('delete_message', { messageId: msgId, userId: currentUserId, type: 'for_all' });
                    queryClient.invalidateQueries({ queryKey: ['userChats'] });
                    queryClient.setQueryData(['chatMessages', id], (old: ChatMessage[] | undefined) => old ? old.map(msg => msg._id === msgId ? { ...msg, content: 'Mensaje eliminado', isDeleted: true } : msg) : []);
                  }} 
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}