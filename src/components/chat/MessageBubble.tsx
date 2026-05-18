import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

interface MessageBubbleProps {
  item: any;
  isMe: boolean;
  senderName?: string;
  isOnline?: boolean;
  onLongPress: (item: any) => void;
  onOpenFile?: (item: any) => void;
  totalParticipants?: number;
  AudioPlayerComponent?: any; 
}

export default function MessageBubble({
  item,
  isMe,
  senderName,
  isOnline,
  onLongPress,
  onOpenFile,
  totalParticipants = 0,
  AudioPlayerComponent
}: MessageBubbleProps) {
  const msgType = item.type || 'text';
  const content = item.content || item.contenido;
  const timeStr = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const readBy = item.readBy || [];
  const isReadByAll = readBy.length >= (totalParticipants - 1);
  
  const isExpired = (msgType === 'file' || msgType === 'audio') && (!item.fileUrl || content === 'Archivo expirado');

  // Clases base con NativeWind (Soporte Dark Mode)
  const bubbleBase = "max-w-[80%] p-3 rounded-2xl mb-2 flex-row items-center gap-2";
  const myBubble = "bg-primary dark:bg-primary-dark self-end rounded-br-sm";
  const otherBubble = "bg-gray-200 dark:bg-gray-700 self-start rounded-bl-sm";
  const expiredBubble = isMe ? "bg-gray-400 self-end rounded-br-sm" : "bg-gray-300 dark:bg-gray-700 self-start rounded-bl-sm";

  const textBase = "text-base leading-5";
  const myText = "text-white";
  const otherText = "text-textMain dark:text-textMain-dark";

  if (isExpired) {
    return (
      <TouchableOpacity className={`${bubbleBase} ${expiredBubble} shadow-sm`}>
        <Ionicons name="document-outline" size={24} color={isMe ? '#eee' : 'gray'} />
        <Text className={`text-sm italic flex-shrink ${isMe ? 'text-gray-100' : 'text-gray-500'}`}>
          Archivo no disponible / expirado
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => onLongPress(item)}
      onPress={() => msgType === 'file' && onOpenFile ? onOpenFile(item) : null}
      className="mb-2"
    >
      {!isMe && senderName && (
        <View className="flex-row items-center mb-1 ml-1">
          <Text className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-1">{senderName}</Text>
          {isOnline && <View className="w-2 h-2 rounded-full bg-green-500" />}
        </View>
      )}
      
      <View className={`${bubbleBase} ${isMe ? myBubble : otherBubble} shadow-sm ${msgType === 'file' || msgType === 'audio' ? 'flex-row' : 'flex-col items-start'}`}>
        
        {/* Render de Audio */}
        {msgType === 'audio' && AudioPlayerComponent && (
          <AudioPlayerComponent fileUrl={item.fileUrl} isSent={isMe} />
        )}

        {/* Render de Archivo */}
        {msgType === 'file' && (
          <>
            <Text className="text-2xl">📄</Text>
            <Text className={`${textBase} ${isMe ? myText : otherText} font-medium flex-shrink`}>{content}</Text>
          </>
        )}

        {/* Render de Texto */}
        {msgType !== 'audio' && msgType !== 'file' && (
          <Text className={`${textBase} ${isMe ? myText : otherText}`}>{content}</Text>
        )}

        {/* Footer: Hora y Checks */}
        <View className={`flex-row justify-end items-center mt-1 gap-1 ${msgType !== 'text' && 'ml-2'}`}>
          <Text className={`text-[10px] ${isMe ? 'text-white/70' : 'text-gray-500'}`}>{timeStr}</Text>
          {isMe && totalParticipants > 0 && (
            <Ionicons
              name="checkmark-done-outline"
              size={16}
              color={isReadByAll ? '#34B7F1' : '#9ca3af'}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
