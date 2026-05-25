import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';

interface MessageBubbleProps {
  item: any;
  isMe: boolean;
  senderName?: string;
  isOnline?: boolean;
  onLongPress?: (item: any) => void;
  onOpenFile?: (item: any) => void; // Se usará también para descargar
  totalParticipants?: number;
  AudioPlayerComponent?: any;
  isGroupChat?: boolean;
  chatParticipants?: any[];
}

export default function MessageBubble({
  item, isMe, senderName, isOnline, onLongPress, onOpenFile, totalParticipants = 0, AudioPlayerComponent, isGroupChat = false, chatParticipants = []
}: MessageBubbleProps) {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?._id;

  const msgType = item.type || 'text';
  const content = item.content || item.contenido;
  const timeStr = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const readBy = item.readBy || [];
  const deliveredTo = item.deliveredTo || [];

  const getMessageStatus = () => {
    if (!isMe) return null;
    const otherParticipantsCount = totalParticipants > 1 ? totalParticipants - 1 : 1;
    const readers = (readBy || []).filter((id: string) => id !== currentUserId);
    const receivers = (deliveredTo || []).filter((id: string) => id !== currentUserId);

    if (isGroupChat) {
      if (readers.length >= otherParticipantsCount && otherParticipantsCount > 0) return 'read';
      if (receivers.length >= otherParticipantsCount && otherParticipantsCount > 0) return 'delivered';
      return 'sent';
    } else {
      if (readers.length > 0) return 'read';
      if (receivers.length > 0) return 'delivered';
      return 'sent';
    }
  };

  const status = getMessageStatus();
  const isExpired = (msgType === 'file' || msgType === 'audio') && (!item.fileUrl || content === 'Archivo expirado');

  const handleMessageInfoPress = () => {
    if (!isGroupChat || !isMe || !chatParticipants || chatParticipants.length === 0) return;
    try {
      const senderId = typeof item.senderId === 'object' ? item.senderId?._id : item.senderId;
      router.push({
        pathname: '/chat/message-info',
        params: {
          messageId: item._id, messageContent: content, senderId: senderId,
          chatParticipantsRaw: JSON.stringify(chatParticipants || []),
          readByRaw: JSON.stringify(readBy || []), deliveredToRaw: JSON.stringify(deliveredTo || []),
        }
      });
    } catch (error) { console.error('Error info msg:', error); }
  };

  const bubbleBase = "max-w-[85%] px-4 py-2.5 rounded-3xl mb-1.5 flex-row items-center shadow-sm";
  const myBubble = "bg-primary dark:bg-primary-dark self-end rounded-br-sm";
  const otherBubble = "bg-white dark:bg-zinc-800 self-start rounded-bl-sm border border-gray-100 dark:border-zinc-700/50";
  const expiredBubble = isMe ? "bg-gray-400 dark:bg-gray-600 self-end rounded-br-sm" : "bg-gray-200 dark:bg-zinc-800 self-start rounded-bl-sm";

  const textBase = "text-[15px] font-nunito-regular leading-5";
  const myText = "text-white";
  const otherText = "text-textMain dark:text-textMain-dark";

  if (isExpired) {
    return (
      <TouchableOpacity activeOpacity={0.8} className={`${bubbleBase} ${expiredBubble}`}>
        <Ionicons name="document-outline" size={22} color={isMe ? '#eee' : 'gray'} />
        <Text className={`text-sm italic ml-2 flex-shrink ${isMe ? 'text-gray-100' : 'text-gray-500'}`}>Archivo expirado (24h)</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onLongPress={() => { if (onLongPress) onLongPress(item); }}
      delayLongPress={350}
      activeOpacity={0.8}
      className="mb-1"
    >
      {!isMe && senderName && (
        <View className="flex-row items-center mb-1 ml-2">
          <Text className="text-[11px] font-snpro-bold text-gray-500 dark:text-gray-400 mr-1">{senderName}</Text>
          {isOnline && <View className="w-1.5 h-1.5 rounded-full bg-green-500" />}
        </View>
      )}

      <View className={`${bubbleBase} ${isMe ? myBubble : otherBubble} ${msgType === 'file' || msgType === 'audio' ? 'flex-row' : 'flex-col items-start'}`}>

        {item.isDeleted ? (
          <View className="flex-row items-center gap-2">
            <Feather name="slash" size={14} color={isMe ? '#ffffff80' : '#9ca3af'} />
            <Text className={`italic text-[15px] ${isMe ? 'text-white/80' : 'text-gray-400'}`}>Mensaje eliminado</Text>
          </View>
        ) : (
          <>
            {msgType === 'audio' && AudioPlayerComponent && (
              <View className="flex-row items-center">
                <AudioPlayerComponent fileUrl={item.fileUrl} isSent={isMe} />
                {/* 🚀 Botón de descarga para Audios */}
                <Pressable onPress={() => onOpenFile && onOpenFile(item)} className={`ml-3 p-2 rounded-full ${isMe ? 'bg-white/20' : 'bg-gray-100 dark:bg-zinc-700'}`}>
                    <Feather name="download" size={14} color={isMe ? '#fff' : '#6B7280'} />
                </Pressable>
              </View>
            )}
            
            {msgType === 'file' && (
              <Pressable onPress={() => onOpenFile && onOpenFile(item)} className="flex-row items-center flex-1">
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isMe ? 'bg-white/20' : 'bg-primary/10 dark:bg-primary-dark/20'}`}>
                    <Ionicons name="document-text" size={20} color={isMe ? '#fff' : '#2A72D4'} />
                </View>
                <View className="flex-1 pr-2">
                    <Text className={`${textBase} ${isMe ? myText : otherText} font-nunito-bold flex-shrink`} numberOfLines={1}>{content}</Text>
                    <Text className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-500'} mt-0.5`}>Toca para descargar</Text>
                </View>
              </Pressable>
            )}

            {msgType !== 'audio' && msgType !== 'file' && (
              <Text className={`${textBase} ${isMe ? myText : otherText}`}>{content}</Text>
            )}
          </>
        )}

        <View className={`flex-row justify-end items-center mt-1 gap-1 ${msgType !== 'text' && 'ml-2'}`}>
          {item.isEdited && !item.isDeleted && <Text className={`text-[10px] italic ${isMe ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'} mr-1`}>Editado</Text>}
          <Text className={`text-[10px] ${isMe ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>{timeStr}</Text>
          
          {isMe && status && (
            <TouchableOpacity onPress={isGroupChat ? handleMessageInfoPress : undefined} disabled={!isGroupChat} className="flex-row items-center justify-end">
              {status === 'sent' && <Ionicons name="checkmark" size={14} color="#ffffff80" />}
              {status === 'delivered' && <Ionicons name="checkmark-done" size={14} color="#ffffff80" />}
              {status === 'read' && <Ionicons name="checkmark-done" size={14} color="#34d399" />}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}