import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 🚀 Importación clave
import Animated, { 
    SlideInLeft, 
    FadeOutLeft,
    useSharedValue, 
    useAnimatedStyle, 
    withSpring 
} from 'react-native-reanimated';

// 🚀 Botón con nuestra animación Squish oficial
const AnimatedSquishLogout = ({ onPress, children }: { onPress: () => void, children: React.ReactNode }) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    
    return (
        <Animated.View style={animatedStyle} className="w-full">
            <Pressable
                onPressIn={() => { scale.value = withSpring(0.94, { damping: 15 }); }}
                onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
                onPress={onPress}
                className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 flex-row justify-center items-center py-4 rounded-2xl shadow-sm"
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};

export default function SideMenu() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets(); // 🚀 Calculamos los bordes de la pantalla

  const iconColor = colorScheme === 'dark' ? '#9CA3AF' : '#4B5563'; 

  const menuItems = [
    { id: 'profile', icon: 'user', label: 'Mi Perfil', route: '/profile' },
    { id: 'docs', icon: 'folder', label: 'Mis Documentos', route: '/documents' },
    { id: 'config', icon: 'sliders', label: 'Personalización', route: '/profile/personalization' },
  ];

  return (
    <Animated.View 
        entering={SlideInLeft.duration(300).springify()} 
        exiting={FadeOutLeft.duration(200)}
        className="absolute top-0 left-0 w-3/4 max-w-[300px] h-full bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-gray-800 shadow-2xl shadow-black/20 z-50 flex-col"
    >
      <View className="p-4 pt-6 flex-1">
        <Text className="text-xs font-snpro-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 ml-2">
            Ajustes de Cuenta
        </Text>

        {menuItems.map((item) => (
            <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                className="flex-row items-center px-4 py-4 mb-2 rounded-2xl bg-gray-50 dark:bg-zinc-800/50"
                onPress={() => router.push(item.route as any)}
            >
                <View className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 justify-center items-center shadow-sm border border-gray-100 dark:border-zinc-700">
                    <Feather name={item.icon as any} size={16} color={iconColor} />
                </View>
                <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark ml-4">
                    {item.label}
                </Text>
                <Feather name="chevron-right" size={16} color={iconColor} className="ml-auto opacity-50" />
            </TouchableOpacity>
        ))}
      </View>

      {/* 🚀 Contenedor inferior dinámico: Respeta los botones de Android (insets.bottom) + un margen visual de 24px */}
      <View className="px-4" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
        <AnimatedSquishLogout onPress={signOut}>
            <Feather name="log-out" size={18} color="#EF4444" className="mr-2" />
            <Text className="text-red-500 font-snpro-bold text-base">Cerrar sesión</Text>
        </AnimatedSquishLogout>
      </View>

    </Animated.View>
  );
}