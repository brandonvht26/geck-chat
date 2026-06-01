import { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { accessUserChat } from '@/src/services/chat.service';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useAuth } from '@/src/hooks/useAuth';

const { width, height } = Dimensions.get('window');

const BottomWaveBackground = () => {
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);

  useEffect(() => {
    rotation1.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false);
    rotation2.value = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
  }, []);

  const style1 = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation1.value}deg` }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation2.value}deg` }] }));

  return (
    <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, width, height: height * 0.35, overflow: 'hidden', zIndex: 0 }}>
      <Animated.View style={[
        { position: 'absolute', bottom: -width * 1.3, left: -width * 0.5, width: width * 2, height: width * 2, borderRadius: width * 0.85, backgroundColor: 'rgba(42, 114, 212, 0.2)' },
        style1
      ]} />
      <Animated.View style={[
        { position: 'absolute', bottom: -width * 1.4, left: -width * 0.45, width: width * 2, height: width * 2, borderRadius: width * 0.9 },
        style2
      ]} className="bg-primary dark:bg-primary-dark" />
    </View>
  );
};
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
  
  // 🚀 Extraemos tu usuario actual para compararlo
  const { user } = useAuth();
  
  const iconColor = colorScheme === 'dark' ? '#E5E7EB' : '#333333';
  const getInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : '?';

  // 🚀 Lógica de Identidad: ¿Soy yo mismo?
  const isMe = String(user?._id) === String(id);

  const handleSendMessage = async () => {
    if (!id || isMe) return; // Doble candado de seguridad
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
      <StatusBar style="light" />
      <BottomWaveBackground />
      
      <View style={{ paddingTop: insets.top }} className="bg-primary dark:bg-primary-dark z-20 border-b border-primary/90 dark:border-zinc-800 shadow-sm">
        <View className="flex-row justify-between items-center px-4 py-3">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:opacity-60">
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-2xl font-snpro-bold text-white tracking-tight">
            Perfil
          </Text>
          <View className="p-2 -mr-2 opacity-0" pointerEvents="none"><Feather name="arrow-left" size={24} /></View>
        </View>
      </View>

      <View className="flex-1 items-center pt-8">
        <View className="w-[180px] h-[180px] rounded-full bg-primary/10 dark:bg-primary-dark/20 border-4 border-white dark:border-zinc-800 shadow-2xl shadow-black/10 justify-center items-center mb-8 overflow-hidden z-10">
            {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
                <Ionicons name="person" size={84} color="#2A72D4" />
            )}
        </View>

        <Text className="text-2xl font-snpro-bold text-textMain dark:text-textMain-dark mb-1">{name || 'Usuario'}</Text>
        <Text className="text-base font-nunito-regular text-gray-500 dark:text-gray-400">{email || 'No disponible'}</Text>

        {/* 🚀 Renderizado Condicional: Si soy yo, muestro un bloque de texto inactivo. Si es otro, el botón. */}
        {isMe ? (
          <View className="w-full mt-8 px-6">
            <View className="bg-gray-50 dark:bg-zinc-800/50 py-4 rounded-2xl items-center flex-row justify-center border border-gray-200 dark:border-zinc-700">
              <Feather name="user" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} className="mr-2" />
              <Text className="text-gray-500 dark:text-gray-400 font-snpro-bold text-base">Este es tu perfil público</Text>
            </View>
          </View>
        ) : (
          <AnimatedSquishButton text="Enviar Mensaje" onPress={handleSendMessage} loading={loading} />
        )}

      </View>
    </View>
  );
}