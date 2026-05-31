import { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Pressable, Text, ActivityIndicator, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { api } from '@/src/services/api';
import { useUserChats } from '@/src/hooks/queries/useUserChats';
import { useAuth } from '@/src/hooks/useAuth';

interface UserSearchProps {
  onUserSelect: (user: any) => void;
  actionLabel?: string;
  actionIcon?: any;
  excludeUserIds?: string[];
  excludeEmails?: string[]; // 🚀 Agregado para soportar el modal de invitación
}

// 🚀 Fila de usuario con física de rebote premium
const AnimatedSquishRow = ({ onPress, children }: { onPress: () => void, children: React.ReactNode }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle} className="w-full">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
        className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800/60 bg-white dark:bg-authEnd-dark"
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export default function UserSearch({ onUserSelect, actionLabel = 'Seleccionar', actionIcon = 'check', excludeUserIds = [], excludeEmails = [] }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { colorScheme } = useColorScheme();
  
  const searchScale = useSharedValue(1);
  const searchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }]
  }));
  
  const { user: currentUser } = useAuth();
  const { data: chats = [] } = useUserChats();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['searchUsers', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.trim().length < 2) return [];
      const response = await api.get('/api/users/search', { params: { q: debouncedQuery } });
      return response.data.users || response.data || [];
    },
    enabled: debouncedQuery.trim().length >= 2,
  });

  // 🚀 Filtro Inteligente: Descarta por ID o por Correo
  const filteredUsers = users.filter((u: any) => 
    !excludeUserIds.includes(u._id) && 
    !excludeEmails.includes(u.email)
  );

  const recentUsers = chats.map(chat => {
      if ((chat as any).isGroup) return null;
      const participants = (chat as any).participants || [];
      const otherUser = participants.find((p: any) => (p?._id || p) !== currentUser?._id);
      if (otherUser && typeof otherUser !== 'string') {
          return {
              _id: otherUser._id,
              name: otherUser.name,
              email: otherUser.email,
              avatarUrl: otherUser.avatarUrl || otherUser.profilePicture,
              profilePicture: otherUser.profilePicture
          };
      }
      return null;
  }).filter(Boolean);

  const uniqueRecentUsers = recentUsers
      .filter((v: any, i: any, a: any) => a.findIndex((t: any) => (t._id === v._id)) === i)
      .filter((u: any) => !excludeUserIds.includes(u._id) && !excludeEmails.includes(u.email));

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      {/* 🚀 Buscador Estilizado */}
      <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <Animated.View style={[searchAnimatedStyle, { flexDirection: 'row', alignItems: 'center' }]} className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 h-12 overflow-hidden">
          <Ionicons name="search" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <TextInput
            className="flex-1 ml-2 text-base font-nunito-regular text-textMain dark:text-textMain-dark h-full"
            placeholder="Buscar por nombre o correo..."
            placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => { searchScale.value = withSpring(1.02, { damping: 12 }); }}
            onBlur={() => { searchScale.value = withSpring(1); }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} className="p-1">
              <Ionicons name="close-circle" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF'} />
            </Pressable>
          )}
        </Animated.View>
      </View>

      {/* Resultados */}
      {isLoading ? (
        <View className="p-8 items-center justify-center flex-1">
          <ActivityIndicator size="large" className="text-primary dark:text-primary-dark" />
        </View>
      ) : filteredUsers.length > 0 ? (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <AnimatedSquishRow onPress={() => onUserSelect(item)}>
              <View className="flex-row items-center flex-1">
                {item.avatarUrl || item.profilePicture ? (
                  <Image source={{ uri: item.avatarUrl || item.profilePicture }} className="w-12 h-12 rounded-full mr-4 border border-gray-100 dark:border-zinc-800" />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary-dark/20 items-center justify-center mr-4">
                    <Text className="text-primary dark:text-primary-dark font-snpro-bold text-lg">
                      {item.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View className="flex-1 pr-4">
                  <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark mb-0.5" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-sm font-nunito-regular text-gray-500 dark:text-gray-400" numberOfLines={1}>{item.email}</Text>
                </View>
              </View>
              {/* 🚀 Botón de acción integrado al tema */}
              <View className="bg-primary/10 dark:bg-primary-dark/15 px-4 py-2 rounded-xl flex-row items-center gap-2">
                <Feather name={actionIcon} size={16} className="text-primary dark:text-primary-dark" />
                <Text className="text-primary dark:text-primary-dark font-snpro-bold text-sm">{actionLabel}</Text>
              </View>
            </AnimatedSquishRow>
          )}
        />
      ) : debouncedQuery.trim().length >= 2 ? (
        <View className="flex-1 justify-center items-center mt-10 px-8">
            <View className="w-16 h-16 rounded-full bg-gray-50 dark:bg-zinc-800 justify-center items-center mb-4">
              <Ionicons name="people-outline" size={32} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
            </View>
            <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark text-center">No hay resultados</Text>
            <Text className="text-sm font-nunito-regular text-gray-500 dark:text-gray-400 text-center mt-1">
              Intenta con otro nombre o asegúrate de que el usuario no sea ya un miembro.
            </Text>
        </View>
      ) : (
        <View className="flex-1">
          {uniqueRecentUsers.length > 0 && (
            <Text className="px-5 py-4 text-sm font-snpro-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Chats recientes
            </Text>
          )}
          <FlatList
            data={uniqueRecentUsers}
            keyExtractor={(item) => item._id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <AnimatedSquishRow onPress={() => onUserSelect(item)}>
                <View className="flex-row items-center flex-1">
                  {item.avatarUrl || item.profilePicture ? (
                    <Image source={{ uri: item.avatarUrl || item.profilePicture }} className="w-12 h-12 rounded-full mr-4 border border-gray-100 dark:border-zinc-800" />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary-dark/20 items-center justify-center mr-4">
                      <Text className="text-primary dark:text-primary-dark font-snpro-bold text-lg">
                        {item.name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1 pr-4">
                    <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark mb-0.5" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-sm font-nunito-regular text-gray-500 dark:text-gray-400" numberOfLines={1}>{item.email}</Text>
                  </View>
                </View>
                {/* 🚀 Botón de acción integrado al tema */}
                <View className="bg-primary/10 dark:bg-primary-dark/15 px-4 py-2 rounded-xl flex-row items-center gap-2">
                  <Feather name={actionIcon} size={16} className="text-primary dark:text-primary-dark" />
                  <Text className="text-primary dark:text-primary-dark font-snpro-bold text-sm">{actionLabel}</Text>
                </View>
              </AnimatedSquishRow>
            )}
          />
        </View>
      )}
    </View>
  );
}