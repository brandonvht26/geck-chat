import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { getToken } from '@/src/services/api';
import { useColorScheme } from 'nativewind'; // 🚀 Escuchador nativo del tema
import Animated, { 
    FadeInDown, 
    FadeOut, 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    Easing 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme(); // 🚀 Hook para detectar modo claro/oscuro
  const scale1 = useSharedValue(0.8);
  const scale2 = useSharedValue(0.8);

  useEffect(() => {
    scale1.value = withRepeat(withTiming(1.2, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true);
    scale2.value = withRepeat(withTiming(1.3, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true);

    const initializeApp = async () => {
      const minimumDelay = new Promise(resolve => setTimeout(resolve, 2500));
      const authCheck = async () => {
        try {
          const token = await getToken();
          return token ? '/home' : '/welcome';
        } catch {
          return '/welcome';
        }
      };

      const [_, route] = await Promise.all([minimumDelay, authCheck()]);
      router.replace(route as Href);
    };

    initializeApp();
  }, []);

  const animatedCircle1 = useAnimatedStyle(() => ({ transform: [{ scale: scale1.value }] }));
  const animatedCircle2 = useAnimatedStyle(() => ({ transform: [{ scale: scale2.value }] }));

  // 🚀 Evaluamos el color exacto para el icono nativo basándonos en tu objeto Tailwind config
  const activeIconColor = colorScheme === 'dark' ? '#8261D4' : '#2A72D4';

  return (
    <View className="flex-1 justify-center items-center overflow-hidden bg-white dark:bg-authEnd-dark">
      <StatusBar translucent={true} backgroundColor="transparent" style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {/* 🚀 Olas circulares con alternancia adaptativa explícita */}
      <Animated.View 
        style={animatedCircle1} 
        className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-primary dark:bg-primary-dark" 
      />
      
      <Animated.View 
        style={animatedCircle2} 
        className="absolute bottom-[-15%] right-[-30%] w-[110vw] h-[110vw] rounded-full bg-secondary dark:bg-secondary-dark" 
      />

      {/* Contenido Central */}
      <Animated.View entering={FadeInDown.duration(1000).springify()} exiting={FadeOut.duration(400)} className="items-center z-10">
        <View className="bg-white dark:bg-zinc-800 p-4 rounded-full shadow-xl shadow-primary/10 dark:shadow-primary-dark/10 mb-4">
            <Ionicons name="chatbubbles" size={56} color={activeIconColor} />
        </View>
        
        <Text className="text-5xl font-nunito-bold text-textMain dark:text-textMain-dark tracking-tight">
          GeckChat
        </Text>
        
        <Text className="text-sm font-elms-bold text-gray-400 dark:text-gray-500 mt-3 tracking-widest uppercase">
          Tu equipo, sin límites
        </Text>
      </Animated.View>

    </View>
  );
}