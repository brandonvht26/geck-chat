import { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Pressable, Text, ActivityIndicator, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { api } from '@/src/services/api';

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

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      {/* 🚀 Buscador Estilizado */}
      <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 h-12">
          <Ionicons name="search" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <TextInput
            className="flex-1 ml-2 text-base font-nunito-regular text-textMain dark:text-textMain-dark"
            placeholder="Buscar por nombre o correo..."
            placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} className="p-1">
              <Ionicons name="close-circle" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF'} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Resultados */}
      {isLoading ? (
        <View className="p-8 items-center justify-center flex-1">
          <ActivityIndicator size="large" className="text-primary dark:text-primary-dark" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            debouncedQuery.length >= 2 ? (
              <View className="flex-1 justify-center items-center mt-10 px-8">
                  <View className="w-16 h-16 rounded-full bg-gray-50 dark:bg-zinc-800 justify-center items-center mb-4">
                    <Ionicons name="people-outline" size={32} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                  </View>
                  <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark text-center">No hay resultados</Text>
                  <Text className="text-sm font-nunito-regular text-gray-500 dark:text-gray-400 text-center mt-1">
                    Intenta con otro nombre o asegúrate de que el usuario no sea ya un miembro.
                  </Text>
              </View>
            ) : null
          }
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
      )}
    </View>
  );
}