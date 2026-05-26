import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export default function MessageInfoScreen() {
  const params = useLocalSearchParams();
  const { colorScheme } = useColorScheme();

  const { participants, readBy, deliveredTo, messageContent, senderId } = useMemo(() => {
    try {
      return {
        participants: params.chatParticipantsRaw ? JSON.parse(params.chatParticipantsRaw as string) : [],
        readBy: params.readByRaw ? JSON.parse(params.readByRaw as string) : [],
        deliveredTo: params.deliveredToRaw ? JSON.parse(params.deliveredToRaw as string) : [],
        messageContent: params.messageContent as string || '',
        senderId: params.senderId as string || ''
      };
    } catch (error) {
      return { participants: [], readBy: [], deliveredTo: [], messageContent: '', senderId: '' };
    }
  }, [params.chatParticipantsRaw, params.readByRaw, params.deliveredToRaw, params.messageContent, params.senderId]);

  const { readUsers, deliveredOnlyUsers, remainingUsers } = useMemo(() => {
    if (!Array.isArray(participants)) return { readUsers: [], deliveredOnlyUsers: [], remainingUsers: [] };
    const recipients = participants.filter((p: any) => p?._id !== senderId);
    
    return {
      readUsers: recipients.filter((p: any) => readBy.includes(p._id)),
      deliveredOnlyUsers: recipients.filter((p: any) => deliveredTo.includes(p._id) && !readBy.includes(p._id)),
      remainingUsers: recipients.filter((p: any) => !deliveredTo.includes(p._id) && !readBy.includes(p._id))
    };
  }, [participants, readBy, deliveredTo, senderId]);

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

  return (
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
      {/* 🚀 Magia de Expo Router: Convertir pantalla en Modal de iOS/Android */}
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Detalles del Mensaje',
          headerTitleStyle: { fontFamily: 'SNPro-Bold', fontSize: 18 },
          headerStyle: { backgroundColor: colorScheme === 'dark' ? '#161121' : '#ffffff' },
          headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#141E30',
          headerShadowVisible: false,
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Contenido del Mensaje */}
        <View className="p-6 bg-white dark:bg-authEnd-dark border-b border-gray-100 dark:border-zinc-800/50 shadow-sm">
          <Text className="text-xs font-snpro-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 ml-1">
            Mensaje
          </Text>
          <View className="bg-primary/10 dark:bg-primary-dark/15 p-4 rounded-2xl border border-primary/20 dark:border-primary-dark/20">
            <Text className="text-base font-nunito-regular text-textMain dark:text-textMain-dark leading-6">
              {messageContent || 'Sin contenido'}
            </Text>
          </View>
        </View>

        {/* Leído por */}
        <View className="mt-4">
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

        {/* Entregado a */}
        <View className="mt-4">
          <View className="flex-row items-center px-6 py-3 bg-gray-100 dark:bg-zinc-800/80 border-y border-gray-200 dark:border-zinc-700/50">
            <Ionicons name="checkmark-done" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <Text className="text-xs font-snpro-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 ml-2">
              Entregado a ({deliveredOnlyUsers.length})
            </Text>
          </View>
          {deliveredOnlyUsers.length > 0 ? deliveredOnlyUsers.map(renderUserRow) : (
            <View className="py-6 px-6 bg-white dark:bg-authEnd-dark"><Text className="text-sm font-nunito-regular text-gray-500 dark:text-gray-400 text-center">{readUsers.length > 0 && remainingUsers.length === 0 ? 'Todos han leído este mensaje' : 'No hay usuarios en esta etapa'}</Text></View>
          )}
        </View>

        {/* Pendiente */}
        {remainingUsers.length > 0 && (
          <View className="mt-4 mb-8">
            <View className="flex-row items-center px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-y border-amber-100 dark:border-amber-900/30">
              <Feather name="clock" size={16} color="#f59e0b" />
              <Text className="text-xs font-snpro-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 ml-2">
                Pendiente ({remainingUsers.length})
              </Text>
            </View>
            {remainingUsers.map(renderUserRow)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}