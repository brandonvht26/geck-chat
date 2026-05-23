import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function MessageInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Memoización y Parseo Defensivo (Prevención de Fugas de Memoria)
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
      console.error('❌ Error parseando parámetros de navegación:', error);
      // Fallback seguro para evitar crash
      return {
        participants: [],
        readBy: [],
        deliveredTo: [],
        messageContent: '',
        senderId: ''
      };
    }
  }, [params.chatParticipantsRaw, params.readByRaw, params.deliveredToRaw, params.messageContent, params.senderId]);

  // Filtrado memoizado de estados de mensaje
  const { readUsers, deliveredOnlyUsers, remainingUsers } = useMemo(() => {
    if (!Array.isArray(participants) || !Array.isArray(readBy) || !Array.isArray(deliveredTo)) {
      return { readUsers: [], deliveredOnlyUsers: [], remainingUsers: [] };
    }

    const recipients = participants.filter((p: any) => p?._id !== senderId);
    
    return {
      readUsers: recipients.filter((p: any) => readBy.includes(p._id)),
      deliveredOnlyUsers: recipients.filter((p: any) => deliveredTo.includes(p._id) && !readBy.includes(p._id)),
      remainingUsers: recipients.filter((p: any) => !deliveredTo.includes(p._id) && !readBy.includes(p._id))
    };
  }, [participants, readBy, deliveredTo, senderId]);

  // Componente de fila de usuario (memoizado para evitar re-renders innecesarios)
  const renderUserRow = (user: any) => {
    if (!user || !user._id) return null;

    const avatarUrl = user.avatarUrl || user.avatar || user.profilePicture;
    const displayName = user.name || user.username || 'Usuario';
    const displayEmail = user.email || user.emailAddress || '';

    return (
      <View key={user._id} className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800/50 px-4">
        <View className="flex-row items-center flex-1">
          {avatarUrl ? (
            <Image 
              source={{ uri: avatarUrl }} 
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"
              defaultSource={{ uri: avatarUrl }}
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center">
              <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-gray-800 dark:text-white">
              {displayName}
            </Text>
            {displayEmail && (
              <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
                {displayEmail}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Información del Mensaje',
          headerBackTitle: 'Atrás',
          headerTintColor: '#007AFF',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 16,
          },
        }}
      />

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
      >
        {/* Sección: Contenido del Mensaje */}
        <View className="p-4 bg-white dark:bg-zinc-800/50 border-b border-gray-200 dark:border-gray-800">
          <Text className="text-xs uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            Mensaje
          </Text>
          <View className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
            <Text className="text-base text-gray-800 dark:text-zinc-200 leading-5">
              {messageContent || 'Sin contenido'}
            </Text>
          </View>
        </View>

        {/* Sección: Leído por (Doble Check Azul) */}
        <View className="mt-4 bg-white dark:bg-zinc-800/30">
          <View className="flex-row items-center px-4 py-2.5 bg-gray-100/70 dark:bg-zinc-800/80">
            <View className="flex-row items-center gap-1">
              <Feather name="check" size={14} color="#3b82f6" strokeWidth={3} />
              <Feather name="check" size={14} color="#3b82f6" strokeWidth={3} style={{ marginLeft: -8 }} />
            </View>
            <Text className="text-xs font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400 ml-2">
              Leído por ({readUsers.length})
            </Text>
          </View>
          {readUsers.length > 0 ? (
            readUsers.map(renderUserRow)
          ) : (
            <View className="py-4 px-4">
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Nadie ha leído este mensaje aún
              </Text>
            </View>
          )}
        </View>

        {/* Sección: Entregado a (Check Gris) */}
        <View className="mt-2 bg-white dark:bg-zinc-800/30">
          <View className="flex-row items-center px-4 py-2.5 bg-gray-100/70 dark:bg-zinc-800/80">
            <View className="flex-row items-center gap-1">
              <Feather name="check" size={14} color="#9ca3af" strokeWidth={3} />
              <Feather name="check" size={14} color="#9ca3af" strokeWidth={3} style={{ marginLeft: -8 }} />
            </View>
            <Text className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-2">
              Entregado a ({deliveredOnlyUsers.length})
            </Text>
          </View>
          {deliveredOnlyUsers.length > 0 ? (
            deliveredOnlyUsers.map(renderUserRow)
          ) : (
            <View className="py-4 px-4">
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {readUsers.length > 0 && remainingUsers.length === 0 
                  ? 'Todos han leído este mensaje' 
                  : 'No hay usuarios en esta etapa'}
              </Text>
            </View>
          )}
        </View>

        {/* Sección: Pendiente (Reloj) */}
        {remainingUsers.length > 0 && (
          <View className="mt-2 bg-white dark:bg-zinc-800/30 mb-8">
            <View className="flex-row items-center px-4 py-2.5 bg-gray-100/70 dark:bg-zinc-800/80">
              <Feather name="clock" size={14} color="#f59e0b" strokeWidth={2.5} />
              <Text className="text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 ml-2">
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
