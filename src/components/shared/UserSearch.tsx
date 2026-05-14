import { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

interface UserSearchProps {
  onUserSelect: (user: any) => void;
  actionLabel?: string;
  actionIcon?: any;
  excludeUserIds?: string[];
}

export default function UserSearch({ onUserSelect, actionLabel = 'Seleccionar', actionIcon = 'check', excludeUserIds = [] }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

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

  const filteredUsers = users.filter((u: any) => !excludeUserIds.includes(u._id));

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      {/* Buscador */}
      <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
          <Feather name="search" size={20} color="#999" />
          <TextInput
            className="flex-1 ml-2 text-base text-textMain dark:text-textMain-dark"
            placeholder="Buscar por nombre o usuario..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Resultados */}
      {isLoading ? (
        <View className="p-4 items-center"><ActivityIndicator size="large" color="#007AFF" /></View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            debouncedQuery.length >= 2 ? (
              <Text className="text-center text-gray-500 mt-4">No se encontraron usuarios</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800/50">
              <View className="flex-row items-center flex-1">
                {item.avatarUrl || item.profilePicture ? (
                  <Image source={{ uri: item.avatarUrl || item.profilePicture }} className="w-12 h-12 rounded-full mr-3" />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mr-3">
                    <Text className="text-blue-600 dark:text-blue-400 font-bold text-lg">{item.name?.charAt(0).toUpperCase() || 'U'}</Text>
                  </View>
                )}
                <View>
                  <Text className="font-semibold text-textMain dark:text-textMain-dark">{item.name}</Text>
                  <Text className="text-sm text-gray-500">{item.email}</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => onUserSelect(item)}
                className="bg-primary dark:bg-primary-dark px-4 py-2 rounded-lg flex-row items-center gap-2"
              >
                <Feather name={actionIcon} size={16} color="#fff" />
                <Text className="text-white font-medium">{actionLabel}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
