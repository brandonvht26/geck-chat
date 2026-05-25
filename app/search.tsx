import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import { searchUsers, SearchedUser } from '@/src/services/user.service';

// 🚀 Fila de usuario elástica (Squish)
const AnimatedSquishUser = ({ onPress, children }: { onPress: () => void, children: React.ReactNode }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  
  return (
    <Animated.View style={animatedStyle} className="w-full">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
        className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800/60 bg-white dark:bg-authEnd-dark"
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#E5E7EB' : '#333333';
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await searchUsers(query);
        setResults(users);
      } catch (error) {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const renderUser = ({ item }: { item: SearchedUser }) => (
    <AnimatedSquishUser
      onPress={() =>
        router.push({
          pathname: '/user/[id]',
          params: { id: item._id, name: item.name, email: item.email, avatarUrl: item.avatarUrl || item.profilePicture },
        })
      }
    >
      <UserAvatar uri={item.avatarUrl || item.profilePicture} size={46} />
      <View className="flex-1 ml-4">
        <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark mb-0.5">{item.name}</Text>
        <Text className="text-sm font-nunito-regular text-gray-500 dark:text-gray-400">{item.email}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colorScheme === 'dark' ? '#4B5563' : '#D1D5DB'} />
    </AnimatedSquishUser>
  );

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      
      {/* 🚀 Header estandarizado: Misma altura y paddings que MainHeader */}
      <View style={{ paddingTop: insets.top }} className="bg-white dark:bg-authEnd-dark z-20">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          
          {/* Botón de regreso universal */}
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 mr-2 active:opacity-60">
            <Feather name="arrow-left" size={24} color={iconColor} />
          </Pressable>

          {/* Barra de búsqueda premium (Misma altura que el input de Workspace) */}
          <View className="flex-1 flex-row items-center bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 h-12">
            <Ionicons name="search" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <TextInput
              className="flex-1 ml-2 text-base font-nunito-regular text-textMain dark:text-textMain-dark"
              placeholder="Buscar por nombre o correo..."
              placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} className="p-1">
                <Ionicons name="close-circle" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF'} />
              </Pressable>
            )}
          </View>

        </View>
      </View>

      {/* 🚀 Resultados */}
      {isSearching ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" className="text-primary dark:text-primary-dark" />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        />
      ) : query.trim().length >= 2 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-20 h-20 rounded-full bg-gray-50 dark:bg-zinc-800 justify-center items-center mb-6 border border-gray-100 dark:border-zinc-700">
            <Ionicons name="people-outline" size={40} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
          </View>
          <Text className="text-lg font-nunito-bold text-textMain dark:text-textMain-dark mb-2 text-center">
            No se encontraron usuarios
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center font-nunito-regular leading-6">
            Asegúrate de que el nombre o correo electrónico esté escrito correctamente.
          </Text>
        </View>
      ) : null}
    </View>
  );
}