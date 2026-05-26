import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, Image, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingOptions } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { toast } from 'sonner-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { useChatMessages } from '@/src/hooks/queries/useChatMessages';
import { useUserChats } from '@/src/hooks/queries/useUserChats';
import { useAuth } from '@/src/hooks/useAuth';
import { api, getErrorMessage } from '@/src/services/api';
import { AxiosError } from 'axios';
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

export default function WorkspaceScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const flatListRef = useRef<FlatList<ChatMessageType>>(null);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [editingMessage, setEditingMessage] = useState<ChatMessageType | null>(null);
  const [selectedMsgOptions, setSelectedMsgOptions] = useState<ChatMessageType | null>(null);

  const audioRecorder = useAudioRecorder(audioOptions);
  const [isRecording, setIsRecording] = useState(false);
  const startTimeRef = useRef(0);

  const hasMarkedRead = useRef(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [unreadSeparatorId, setUnreadSeparatorId] = useState<string | null>(null);
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
    } catch (error) { toast.error('Error cargando historial', { description: getErrorMessage(error as AxiosError) }); } finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { loadWorkspaceChat(); }, [loadWorkspaceChat]);

  useChatSocket({
    chatId: currentChatId, currentUserId: currentUserId,
    onMembersChange: () => { loadWorkspaceChat(); queryClient.invalidateQueries({ queryKey: ['userChats'] }); }
  });

  useEffect(() => {
    if (messages.length > 0 && !unreadSeparatorId && currentUserId) {
      let foundUnreadId = null;
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        const senderStr = extractId(m.senderId);
        const readArr = Array.isArray((m as any).readBy) ? (m as any).readBy.map(extractId) : [];
        if (senderStr !== currentUserId && !readArr.includes(currentUserId)) {
          foundUnreadId = m._id;
          break;
        }
      }
      setUnreadSeparatorId(foundUnreadId || 'none');
    }
  }, [messages.length, currentUserId, unreadSeparatorId]);

  const { onlineUsers } = useSocket();
  const onlineCount = members.filter(m => onlineUsers.includes(extractId(m._id))).length;

  const getMemberName = useCallback((memberId: string) => {
    const member = members.find(m => m._id === memberId);
    return member?.name || member?.username || 'Usuario';
  }, [members]);

  const currentChatData = userChats?.find(c => c._id === currentChatId);
  const isGroupAdmin = currentChatData?.admins?.some((admin: any) => extractId(admin) === String(currentUserId)) || currentChatData?.workspaceId?.owner === currentUserId;

  useEffect(() => {
    if (!currentChatId || !currentUserId || messages.length === 0 || hasMarkedRead.current) return;
    hasMarkedRead.current = true;
    queryClient.setQueryData(['userChats'], (oldChats: any[]) => oldChats ? oldChats.map(chat => String(chat._id) === String(currentChatId) ? { ...chat, unreadCounts: { ...chat.unreadCounts, [currentUserId]: 0 } } : chat) : oldChats);
    SocketService.emit('mark_read', { chatId: currentChatId, userId: currentUserId });
    api.patch(`/api/chat/${currentChatId}/read`).catch(() => { });
    const timer = setTimeout(() => {
      queryClient.setQueryData(['chatMessages', currentChatId], (oldMessages: any[]) => oldMessages ? oldMessages.map(msg => {
        const senderStr = extractId(msg.senderId);
        const readArr = Array.isArray((msg as any).readBy) ? (msg as any).readBy.map(extractId) : [];
        if (senderStr !== String(currentUserId) && !readArr.includes(String(currentUserId))) {
          return { ...msg, readBy: [...(msg.readBy || []), currentUserId], deliveredTo: [...(msg.deliveredTo || []), currentUserId] };
        }
        return msg;
      }) : oldMessages);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentChatId, currentUserId, queryClient, messages.length]);

  const handleLongPress = useCallback((item: ChatMessageType) => {
    const senderIdStr = typeof item.senderId === 'object' ? (item.senderId as any)._id : item.senderId;
    if (senderIdStr === currentUserId) setSelectedMsgOptions(item);
  }, [currentUserId]);

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > 5 * 1024 * 1024) return Alert.alert('Archivo muy pesado', 'Por favor, selecciona un archivo menor a 5MB.');
      const safeFileName = asset.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const safeMimeType = asset.mimeType || 'application/octet-stream';
      const newMsg = await sendFileMessage(currentChatId!, asset.uri, safeFileName, safeMimeType);
      queryClient.setQueryData(['chatMessages', currentChatId], (old: ChatMessageType[] | undefined) => old ? (old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old]) : [newMsg]);
    } catch (error) { Alert.alert('Error', 'No se pudo adjuntar el archivo al grupo.'); }
  };

  const handleOpenFile = async (message: any) => {
    try {
      const fileName: string = message.content || message.contenido || '';
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${safeFileName}`;
      const cachedFileInfo = await FileSystem.getInfoAsync(fileUri);
      if (cachedFileInfo.exists) { await Sharing.shareAsync(fileUri, { UTI: 'public.item' }); } 
      else { await FileSystem.downloadAsync(message.fileUrl, fileUri); await Sharing.shareAsync(fileUri, { UTI: 'public.item' }); }
    } catch (error) { console.error('Error opening file:', error); }
  };

  const sendMessageLocal = useCallback(async () => {
    const cleanedMessage = newMessage.trim();
    if (!cleanedMessage || !currentChatId) return;
    if (editingMessage) {
      try {
        const updated = await editMessage(editingMessage._id, cleanedMessage);
        queryClient.setQueryData(['chatMessages', currentChatId], (old: ChatMessageType[] | undefined) => old ? old.map(msg => msg._id === editingMessage._id ? updated : msg) : []);
        setNewMessage('');
        setEditingMessage(null);
      } catch (error) { toast.error('Error al editar mensaje', { description: getErrorMessage(error as AxiosError) }); }
      return;
    }
    const msgData = { chatId: currentChatId, content: cleanedMessage, clientTimestamp: new Date().toISOString() };
    const localMsg: ChatMessageType = { _id: Date.now().toString(), senderId: currentUserId!, receiverId: currentChatId, contenido: cleanedMessage, createdAt: new Date().toISOString() } as ChatMessageType;
    queryClient.setQueryData(['chatMessages', currentChatId], (old: ChatMessageType[] | undefined) => old ? [localMsg, ...old] : [localMsg]);
    try {
      await api.post('/api/chat/message', msgData);
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    } catch (error) { toast.error('Error enviando mensaje', { description: getErrorMessage(error as AxiosError) }); }
  }, [newMessage, currentChatId, editingMessage, currentUserId, queryClient]);

  const startRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync(audioOptions);
      await audioRecorder.record();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      try { require('expo-haptics').impactAsync(); } catch { }
    } catch (err) { toast.error('Error al iniciar el micrófono', { description: getErrorMessage(err as AxiosError) }); }
  };

  const cancelRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    try { await audioRecorder.stop(); } catch (error) {}
  };

  const stopRecording = async () => {
    if (!isRecording || !currentChatId) return;
    setIsRecording(false);
    const elapsed = Date.now() - startTimeRef.current;
    
    try {
      const currentUri = audioRecorder.uri;
      await audioRecorder.stop();
      await new Promise(resolve => setTimeout(resolve, 300));

      if (elapsed < 800) {
        toast.info('Audio muy corto', { description: 'Mantén presionado o graba más tiempo.' });
        return; 
      }
      
      if (currentUri && id) {
        const duration = elapsed / 1000;
        const newMsg = await sendAudioMessage(currentChatId, currentUri, duration);
        queryClient.setQueryData(['chatMessages', currentChatId], (old: ChatMessageType[] | undefined) => old ? (old.some(msg => msg._id === newMsg._id) ? old : [newMsg, ...old]) : [newMsg]);
      }
    } catch (error: any) { toast.error('Error enviando nota de voz', { description: getErrorMessage(error as AxiosError) || 'Revisa la conexión.' }); }
  };

  const handleLeaveGroup = () => {
    Alert.alert('Abandonar grupo', '¿Estás seguro de que deseas salir de este grupo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => {
          try {
            queryClient.cancelQueries({ queryKey: ['chatMessages', currentChatId] });
            await leaveWorkspace(id);
            queryClient.removeQueries({ queryKey: ['chatMessages', currentChatId] });
            queryClient.invalidateQueries({ queryKey: ['userChats'] });
            router.replace('/home');
            toast.success('Has salido del grupo');
          } catch (error: any) { toast.error(getErrorMessage(error as AxiosError) || 'Error al salir del grupo'); }
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
            await deleteGroupChat(currentChatId!);
            queryClient.removeQueries({ queryKey: ['chatMessages', currentChatId] });
            queryClient.invalidateQueries({ queryKey: ['userChats'] });
            router.replace('/home');
            toast.success('Grupo eliminado correctamente');
          } catch (error: any) { toast.error(getErrorMessage(error as AxiosError) || 'Error al eliminar el grupo'); }
        }
      }
    ]);
  };

  const renderMessage = ({ item }: { item: ChatMessageType }) => {
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
              <Text className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">Mensajes no leídos</Text>
            </View>
            <View className="flex-1 h-[1px] bg-indigo-200 dark:bg-indigo-900/50" />
          </View>
        )}
        <MessageBubble item={item} isMe={isSent} senderName={senderNameStr} isOnline={isOnline} onLongPress={handleLongPress} onOpenFile={handleOpenFile} totalParticipants={members.length} AudioPlayerComponent={AudioPlayer} isGroupChat={true} chatParticipants={members} />
      </View>
    );
  };

  const userWallpaper = user?.preferences?.phoneWallpaperUrl;
  const wallpaperStr = userWallpaper ? userWallpaper : 'bundled:primary';
  const isBundled = wallpaperStr.startsWith('bundled:');
  const imageSource = isBundled 
    ? bundledWallpapers[wallpaperStr.split(':')[1] as keyof typeof bundledWallpapers] 
    : { uri: wallpaperStr };

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      
      {/* 🚀 Cabecera Personalizada Premium */}
      <View style={{ paddingTop: insets.top }} className="bg-white dark:bg-authEnd-dark z-20 border-b border-gray-100 dark:border-zinc-800 shadow-sm">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center flex-1">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2 mr-2 active:opacity-60">
              <Feather name="arrow-left" size={24} color={colorScheme === 'dark' ? '#E5E7EB' : '#141E30'} />
            </Pressable>
            
            <View className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary-dark/20 justify-center items-center overflow-hidden border border-gray-200 dark:border-zinc-700">
                {workspaceData?.imageUrl ? (
                    <Image source={{ uri: workspaceData.imageUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <Feather name="users" size={20} color="#2A72D4" />
                )}
            </View>
            <Text className="text-lg font-snpro-bold text-textMain dark:text-textMain-dark ml-3 flex-1" numberOfLines={1}>{name}</Text>
          </View>

          <Pressable
            onPress={() => router.push({ pathname: '/workspace/invite', params: { workspaceId: id, existingMembersRaw: JSON.stringify(members.map(m => extractId(m))) } })}
            className="p-2 -mr-2 bg-primary/10 dark:bg-primary-dark/20 rounded-full ml-2"
          >
            <Feather name="user-plus" size={18} color="#2A72D4" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
      >
        <ImageBackground source={imageSource as any} resizeMode="cover" style={{ flex: 1 }}>
          
          {/* Barra de Miembros Online */}
          {members.length > 0 && (
            <Pressable className="flex-row items-center justify-between px-4 py-2 bg-white/90 dark:bg-zinc-900/90 border-b border-gray-100 dark:border-zinc-800 backdrop-blur-md z-10" onPress={() => setShowMembersModal(true)}>
              <View className="flex-row items-center">
                {members.slice(0, 5).map((member) => {
                  const memberData = member.userId || member;
                  const isOnline = onlineUsers.includes(extractId(memberData._id));
                  return (
                    <View key={extractId(memberData._id)} className="-mr-1.5 relative">
                      <UserAvatar uri={memberData.avatarUrl} size={28} />
                      {isOnline && <View className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-zinc-900 absolute -bottom-0.5 -right-0.5" />}
                    </View>
                  );
                })}
                {members.length > 5 && (
                  <View className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 items-center justify-center border-2 border-white dark:border-zinc-900">
                    <Text className="text-[10px] font-snpro-bold text-gray-500">+{members.length - 5}</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs font-nunito-bold text-gray-500 dark:text-gray-400">{onlineCount} activos <Feather name="chevron-down" size={12} /></Text>
            </Pressable>
          )}

          <FlatList
            ref={flatListRef}
            style={{ flex: 1 }}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            ListEmptyComponent={
              isChatLoading ? (
                <View className="flex-1 justify-center items-center mt-20"><ActivityIndicator size="large" className="text-primary" /></View>
              ) : (
                <View className="flex-1 justify-center items-center mt-20 px-8">
                  <View className="w-20 h-20 rounded-full bg-gray-50 dark:bg-zinc-800/80 justify-center items-center mb-6">
                    <Feather name="layers" size={32} color={colorScheme === 'dark' ? '#9CA3AF' : '#D1D5DB'} />
                  </View>
                  <Text className="text-center text-lg font-nunito-bold text-gray-400 dark:text-gray-500">Workspace Vacío</Text>
                </View>
              )
            }
            contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: Math.max(insets.bottom, 16) }}
            inverted={messages.length > 0}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />
          <ChatInput
            content={newMessage}
            setContent={setNewMessage}
            onSend={sendMessageLocal}
            onAttach={handleAttachFile}
            isRecording={isRecording}
            onStartRecord={startRecording}
            onStopRecord={stopRecording}
            onCancelRecord={cancelRecording}
            isEditing={!!editingMessage}
            onCancelEdit={() => { setEditingMessage(null); setNewMessage(''); }}
          />
        </ImageBackground>
      </KeyboardAvoidingView>

      {/* 🚀 Modal de Opciones del Mensaje */}
      <Modal visible={!!selectedMsgOptions} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setSelectedMsgOptions(null)}>
          <Pressable 
            className="bg-white dark:bg-authEnd-dark rounded-t-3xl px-6 pt-6 pb-10" 
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full self-center mb-6" />
            <Text className="text-xl font-snpro-bold text-textMain dark:text-textMain-dark text-center mb-4">Opciones del mensaje</Text>

            <AnimatedMenuRow 
              icon="information-circle-outline" title="Ver Información" 
              onPress={() => {
                const msg = selectedMsgOptions!; setSelectedMsgOptions(null);
                router.push({ pathname: '/chat/message-info', params: { messageId: msg._id, messageContent: msg.contenido || msg.content || '', senderId: currentUserId, chatParticipantsRaw: JSON.stringify(members || []), readByRaw: JSON.stringify(msg.readBy || []), deliveredToRaw: JSON.stringify(msg.deliveredTo || []) } });
              }} 
            />

            {!selectedMsgOptions?.isDeleted && selectedMsgOptions?.type !== 'audio' && selectedMsgOptions?.type !== 'file' && (
              <AnimatedMenuRow 
                icon="create-outline" title="Editar" 
                onPress={() => { setEditingMessage(selectedMsgOptions); setNewMessage(selectedMsgOptions!.contenido || selectedMsgOptions!.content || ''); setSelectedMsgOptions(null); }}
              />
            )}

            <AnimatedMenuRow 
              icon="trash-outline" title="Eliminar para mí" danger={true}
              onPress={async () => {
                const msgId = selectedMsgOptions!._id; setSelectedMsgOptions(null); await deleteMessage(msgId, 'for_me');
                queryClient.setQueryData(['chatMessages', currentChatId], (old: ChatMessageType[] | undefined) => old ? old.filter(msg => msg._id !== msgId) : []);
              }} 
            />

            {!selectedMsgOptions?.isDeleted && (
              <AnimatedMenuRow 
                icon="trash-bin-outline" title="Eliminar para todos" danger={true}
                onPress={async () => {
                  const msgId = selectedMsgOptions!._id; setSelectedMsgOptions(null); await deleteMessage(msgId, 'for_all');
                  queryClient.setQueryData(['chatMessages', currentChatId], (old: ChatMessageType[] | undefined) => old ? old.map(msg => msg._id === msgId ? { ...msg, contenido: 'Mensaje eliminado' } : msg) : []);
                }} 
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Miembros */}
      <Modal visible={showMembersModal} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowMembersModal(false)}>
          <Pressable className="bg-white dark:bg-authEnd-dark rounded-t-3xl pt-6 pb-8" style={{ maxHeight: '70%', paddingBottom: Math.max(insets.bottom, 24) }} onPress={(e) => e.stopPropagation()}>
            <View className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full self-center mb-6" />
            <Text className="text-xl font-snpro-bold text-textMain dark:text-textMain-dark text-center mb-4">Miembros del Grupo</Text>
            
            <FlatList
              data={members}
              keyExtractor={item => (item.userId || item)._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const memberData = item.userId || item;
                const isOnline = onlineUsers.includes(extractId(memberData._id));
                return (
                  <Pressable
                    className="flex-row items-center px-6 py-3 border-b border-gray-100 dark:border-zinc-800/60"
                    onPress={() => {
                      setShowMembersModal(false);
                      if (String(memberData._id) !== String(currentUserId)) {
                        router.push({ pathname: '/user/[id]', params: { id: memberData._id, name: memberData.name || memberData.username, email: memberData.email || '', avatarUrl: memberData.avatarUrl || '' } });
                      }
                    }}
                  >
                    <View className="relative mr-4">
                      <UserAvatar uri={memberData.avatarUrl} size={44} />
                      {isOnline && <View className="w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white dark:border-authEnd-dark absolute bottom-0 right-0" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark">{memberData.name || memberData.username || 'Usuario'} {String(memberData._id) === String(currentUserId) && '(Tú)'}</Text>
                      <Text className="text-xs font-nunito-regular text-gray-500 dark:text-gray-400">{isOnline ? 'En línea' : 'Desconectado'}</Text>
                    </View>
                    {String(memberData._id) !== String(currentUserId) && <Feather name="message-circle" size={20} color="#2A72D4" />}
                  </Pressable>
                );
              }}
              ListFooterComponent={() => (
                <View className="px-6 mt-6">
                  <AnimatedMenuRow 
                    icon={isGroupAdmin ? "trash-bin-outline" : "log-out-outline"} 
                    title={isGroupAdmin ? 'Eliminar Grupo' : 'Abandonar Grupo'} 
                    danger={true} 
                    onPress={isGroupAdmin ? handleDeleteGroup : handleLeaveGroup} 
                  />
                </View>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}