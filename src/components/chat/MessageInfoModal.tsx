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

  const extractId = (obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      if (obj.userId && obj.userId._id) return String(obj.userId._id);
      if (obj.userId && typeof obj.userId === 'string') return String(obj.userId);
      if (obj._id) return String(obj._id);
    }
    return String(obj);
  };

  const { readUsers, deliveredUsers, remainingUsers, statusLabel, statusColor, statusIcon } = useMemo(() => {
    if (!message || !Array.isArray(participants)) return { readUsers: [], deliveredUsers: [], remainingUsers: [], statusLabel: 'Enviado', statusColor: 'text-gray-500', statusIcon: 'checkmark' };
    
    const senderIdStr = extractId(message.senderId);
    const recipients = participants.filter((p: any) => extractId(p) !== senderIdStr);
    
    const readByStr = Array.isArray(message.readBy) ? message.readBy.map(extractId) : [];
    const deliveredToStr = Array.isArray(message.deliveredTo) ? message.deliveredTo.map(extractId) : [];
    
    const read = recipients.filter((p: any) => readByStr.includes(extractId(p)));
    const delivered = recipients.filter((p: any) => deliveredToStr.includes(extractId(p)) && !readByStr.includes(extractId(p)));
    const remaining = recipients.filter((p: any) => !readByStr.includes(extractId(p)) && !deliveredToStr.includes(extractId(p)));

    let label = 'Enviado';
    let color = 'text-gray-500 dark:text-gray-400';
    let icon = 'checkmark-outline';

    if (read.length > 0 && read.length === recipients.length) {
      label = 'Leído por todos';
      color = 'text-blue-500 dark:text-blue-400';
      icon = 'checkmark-done';
    } else if (read.length > 0) {
      const names = read.map(r => (r.userId?.name || r.userId?.username || r.name || r.username)).filter(Boolean);
      label = names.length <= 2 ? `Leído por ${names.join(', ')}` : `Leído por ${read.length}`;
      color = 'text-blue-500 dark:text-blue-400';
      icon = 'checkmark-done';
    } else if (delivered.length > 0) {
      const names = delivered.map(r => (r.userId?.name || r.userId?.username || r.name || r.username)).filter(Boolean);
      label = names.length <= 2 ? `Entregado a ${names.join(', ')}` : `Entregado a ${delivered.length}`;
      color = 'text-gray-500 dark:text-gray-400';
      icon = 'checkmark-done';
    }

    return { readUsers: read, deliveredUsers: delivered, remainingUsers: remaining, statusLabel: label, statusColor: color, statusIcon: icon };
  }, [message, participants]);

  const renderUserRow = (rawUser: any, index: number) => {
    if (!rawUser) return null;
    const user = rawUser.userId || rawUser;
    const id = user._id || user.id || (typeof user === 'string' ? user : `user_${index}`);
    const avatarUrl = user.avatarUrl || user.avatar || user.profilePicture;
    const displayName = user.name || user.username || (typeof user === 'string' ? `ID: ${user}` : 'Usuario');
    const displayEmail = user.email || '';

    return (
      <View key={id} className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800/50 px-6 bg-white dark:bg-authEnd-dark">
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
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-center items-center bg-black/50 dark:bg-black/70 px-4">
          <TouchableWithoutFeedback>
            <View className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm max-h-[80%] shadow-2xl overflow-hidden">
              
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-800/30">
                <View>
                  <Text className="text-lg font-snpro-bold text-textMain dark:text-textMain-dark">Info del Mensaje</Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name={statusIcon as any} size={14} className={statusColor} color={statusColor.includes('blue') ? '#3b82f6' : '#6B7280'} />
                    <Text className={`text-xs font-nunito-bold ml-1 ${statusColor}`}>{statusLabel}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} className="p-2 bg-gray-200/60 dark:bg-zinc-800 rounded-full">
                  <Ionicons name="close" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </View>

              <ScrollView className="w-full shrink" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                
                {/* Contenido del Mensaje */}
                <View className="p-6 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800/50">
                  <Text className="text-xs font-snpro-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Contenido
                  </Text>
                  <View className="bg-primary/5 dark:bg-primary-dark/10 p-4 rounded-2xl border border-primary/10 dark:border-primary-dark/20">
                    <Text className="text-base font-nunito-regular text-textMain dark:text-textMain-dark leading-6">
                      {messageContent}
                    </Text>
                  </View>
                </View>

                {/* Leído por */}
                <View className="mt-2">
                  <View className="flex-row items-center px-6 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-y border-blue-50 dark:border-blue-900/20">
                    <Ionicons name="checkmark-done" size={16} color="#3b82f6" />
                    <Text className="text-xs font-snpro-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 ml-2">
                      Leído por ({readUsers.length})
                    </Text>
                  </View>
                  {readUsers.length > 0 ? readUsers.map((u, i) => renderUserRow(u, i)) : (
                    <View className="py-6 px-6 bg-white dark:bg-zinc-900"><Text className="text-sm font-nunito-regular text-gray-400 dark:text-gray-500 text-center">Nadie ha leído este mensaje aún</Text></View>
                  )}
                </View>

                {/* Entregado a */}
                {deliveredUsers.length > 0 && (
                  <View className="mt-2">
                    <View className="flex-row items-center px-6 py-3 bg-gray-50 dark:bg-zinc-800/50 border-y border-gray-100 dark:border-zinc-800/80">
                      <Ionicons name="checkmark-done" size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                      <Text className="text-xs font-snpro-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 ml-2">
                        Entregado a ({deliveredUsers.length})
                      </Text>
                    </View>
                    {deliveredUsers.map((u, i) => renderUserRow(u, i))}
                  </View>
                )}

                {/* Pendiente */}
                {remainingUsers.length > 0 && (
                  <View className="mt-2 mb-4">
                    <View className="flex-row items-center px-6 py-3 bg-gray-50 dark:bg-zinc-800/50 border-y border-gray-100 dark:border-zinc-800/80">
                      <Feather name="clock" size={14} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                      <Text className="text-xs font-snpro-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 ml-2">
                        Pendiente de entrega ({remainingUsers.length})
                      </Text>
                    </View>
                    {remainingUsers.map((u, i) => renderUserRow(u, i))}
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
