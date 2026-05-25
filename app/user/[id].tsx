import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { accessUserChat } from '@/src/services/chat.service';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedSquishButton = ({ onPress, text, loading }: { onPress: () => void, text: string, loading: boolean }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  
  return (
    <Animated.View style={animatedStyle} className="w-full mt-8 px-6">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
        disabled={loading}
        className={`bg-primary dark:bg-primary-dark py-4 rounded-2xl items-center shadow-lg shadow-primary/20 flex-row justify-center ${loading ? 'opacity-70' : ''}`}
      >
        {loading ? <ActivityIndicator color="#ffffff" /> : (
            <>
                <Feather name="message-circle" size={20} color="#ffffff" className="mr-2" />
                <Text className="text-white font-snpro-bold text-base">{text}</Text>
            </>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default function UserProfileScreen() {
  const { id, name, email, avatarUrl } = useLocalSearchParams<{ id: string; name: string; email: string; avatarUrl?: string }>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  const iconColor = colorScheme === 'dark' ? '#E5E7EB' : '#333333';
  const getInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : '?';

  const handleSendMessage = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const chat = await accessUserChat(id);
      router.replace(`/chat/${chat._id}`); 
    } catch (error) {
      console.error('Error accessing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      
      <View style={{ paddingTop: insets.top }} className="bg-white dark:bg-authEnd-dark z-20">
        <View className="flex-row justify-between items-center px-4 py-3 bg-white dark:bg-authEnd-dark border-b border-gray-100 dark:border-gray-800">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:opacity-60">
            <Feather name="arrow-left" size={24} color={iconColor} />
          </Pressable>
          <Text className="text-2xl font-snpro-bold text-textMain dark:text-textMain-dark tracking-tight">
            Perfil
          </Text>
          <View className="p-2 -mr-2 opacity-0" pointerEvents="none"><Feather name="arrow-left" size={24} /></View>
        </View>
      </View>

      <View className="flex-1 items-center pt-14">
        {/* 🚀 Avatar Forzado a 180px con valores arbitrarios de NativeWind */}
        <View className="w-[180px] h-[180px] rounded-full bg-primary/10 dark:bg-primary-dark/20 border-4 border-white dark:border-zinc-800 shadow-2xl shadow-black/10 justify-center items-center mb-8 overflow-hidden">
            {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
                <Text className="text-6xl font-snpro-bold text-primary dark:text-primary-dark">{getInitial(name)}</Text>
            )}
        </View>

        <Text className="text-2xl font-snpro-bold text-textMain dark:text-textMain-dark mb-1">{name || 'Usuario'}</Text>
        <Text className="text-base font-nunito-regular text-gray-500 dark:text-gray-400">{email || 'No disponible'}</Text>

        <AnimatedSquishButton text="Enviar Mensaje" onPress={handleSendMessage} loading={loading} />
      </View>
    </View>
  );
}