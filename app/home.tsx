import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import MainHeader from '@/src/components/layout/MainHeader';
import SideMenu from '@/src/components/layout/SideMenu';
import ChatList from '@/src/components/chat/ChatList';

// 🚀 FAB Premium con física de resorte (Squish) y sombras adaptativas
const AnimatedFAB = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animatedStyle, { position: 'absolute', bottom: 24, right: 24, zIndex: 50 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.9, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
        className="w-14 h-14 rounded-full bg-primary dark:bg-primary-dark justify-center items-center shadow-lg shadow-primary/40 dark:shadow-black/50"
      >
        <Feather name="plus" size={28} color="#ffffff" />
      </Pressable>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      
      {/* 🚀 Cabecera protegida por el SafeArea dinámico */}
      <View style={{ paddingTop: insets.top }} className="bg-white dark:bg-authEnd-dark z-20">
        <MainHeader onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} />
      </View>

      <View className="flex-1 relative">
        {/* La lógica original de tu menú lateral se mantiene intacta */}
        {isMenuOpen && <SideMenu />}
        
        {/* Lista principal */}
        <ChatList />
      </View>

      {/* Botón Flotante */}
      <AnimatedFAB onPress={() => router.push('/workspace/create')} />
      
    </View>
  );
}