import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { ChatMessage } from '@/src/services/chat.service';

interface MessageInfoModalProps {
  visible: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  participants: any[];
  currentUserId: string | null;
}

export default function MessageInfoModal({ visible, onClose, message, participants, currentUserId }: MessageInfoModalProps) {
  const { colorScheme } = useColorScheme();

  const { readUsers, remainingUsers } = useMemo(() => {
    if (!message || !Array.isArray(participants)) return { readUsers: [], remainingUsers: [] };
    
    // Filtramos al enviador
    const senderIdStr = typeof message.senderId === 'object' ? (message.senderId as any)._id : message.senderId;
    const recipients = participants.filter((p: any) => (p?._id || p) !== senderIdStr);
    
    const readBy = Array.isArray(message.readBy) ? message.readBy.map(id => typeof id === 'object' ? (id as any)._id : String(id)) : [];
    
    return {
      readUsers: recipients.filter((p: any) => readBy.includes(p?._id || p)),
      remainingUsers: recipients.filter((p: any) => !readBy.includes(p?._id || p))
    };
  }, [message, participants]);

  const renderUserRow = (user: any) => {
    if (!user || !user._id) return null;
    const avatarUrl = user.avatarUrl || user.avatar || user.profilePicture;
    const displayName = user.name || user.username || 'Usuario';
    const displayEmail = user.email || '';

    return (
      <View key={user._id} className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800/50 px-6 bg-white dark:bg-authEnd-dark">
        <View className="flex-row items-center flex-1">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-12 h-12 rounded-full bg-gray-200 dark:bg-zinc-800" />
          ) : (
            <View className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary-dark/20 items-center justify-center">
              <Text className="text-primary dark:text-primary-dark font-snpro-bold text-lg">{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View className="ml-4 flex-1">
            <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark">{displayName}</Text>
            {displayEmail ? <Text className="text-xs font-nunito-regular text-gray-500 dark:text-gray-400">{displayEmail}</Text> : null}
          </View>
        </View>
      </View>
    );
  };

  if (!message) return null;

  let messageContent = message.content || message.contenido || 'Sin contenido';
  if (message.type === 'audio') messageContent = '🎵 Audio';
  else if (message.type === 'file') messageContent = `📄 Archivo adjunto: ${message.content}`;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/40 dark:bg-black/60">
          <TouchableWithoutFeedback>
            <View className="bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[85%]">
              
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800/80">
                <Text className="text-lg font-snpro-bold text-textMain dark:text-textMain-dark">Detalles del Mensaje</Text>
                <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                  <Ionicons name="close" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                
                {/* Contenido del Mensaje */}
                <View className="p-6 bg-white dark:bg-authEnd-dark shadow-sm">
                  <Text className="text-xs font-snpro-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 ml-1">
                    Mensaje
                  </Text>
                  <View className="bg-primary/10 dark:bg-primary-dark/15 p-4 rounded-2xl border border-primary/20 dark:border-primary-dark/20">
                    <Text className="text-base font-nunito-regular text-textMain dark:text-textMain-dark leading-6">
                      {messageContent}
                    </Text>
                  </View>
                </View>

                {/* Leído por */}
                <View className="mt-2">
                  <View className="flex-row items-center px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-y border-blue-100 dark:border-blue-900/30">
                    <Ionicons name="checkmark-done" size={18} color="#3b82f6" />
                    <Text className="text-xs font-snpro-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 ml-2">
                      Leído por ({readUsers.length})
                    </Text>
                  </View>
                  {readUsers.length > 0 ? readUsers.map(renderUserRow) : (
                    <View className="py-6 px-6 bg-white dark:bg-authEnd-dark"><Text className="text-sm font-nunito-regular text-gray-500 dark:text-gray-400 text-center">Nadie ha leído este mensaje aún</Text></View>
                  )}
                </View>

                {/* Pendiente */}
                {remainingUsers.length > 0 && (
                  <View className="mt-4 mb-8">
                    <View className="flex-row items-center px-6 py-3 bg-gray-100 dark:bg-zinc-800/80 border-y border-gray-200 dark:border-zinc-700/50">
                      <Feather name="clock" size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                      <Text className="text-xs font-snpro-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 ml-2">
                        Pendiente ({remainingUsers.length})
                      </Text>
                    </View>
                    {remainingUsers.map(renderUserRow)}
                  </View>
                )}
              </ScrollView>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
