import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    SlideInLeft,
    SlideOutLeft,
    useSharedValue,
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';

// 🚀 Componente Squish purificado (Sin shadow-sm para evitar bugs de translucidez)
const AnimatedSquishItem = ({ onPress, className, children }: { onPress: () => void, className: string, children: React.ReactNode }) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View style={animatedStyle} className="w-full mb-3">
            <Pressable
                onPressIn={() => { scale.value = withSpring(0.94, { damping: 15 }); }}
                onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
                onPress={onPress}
                className={`flex-row items-center px-5 py-4 rounded-2xl border ${className}`}
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
    const insets = useSafeAreaInsets();

    const primaryColor = colorScheme === 'dark' ? '#8261D4' : '#2A72D4';
    const secondaryColor = colorScheme === 'dark' ? '#EAA945' : '#D9821E';
    const tertiaryColor = colorScheme === 'dark' ? '#BBE068' : '#93BE38';
    const warningColor = colorScheme === 'dark' ? '#ED7474' : '#E14B4B';

    return (
        <Animated.View
            entering={SlideInLeft.duration(300)}
            exiting={SlideOutLeft.duration(250)}
            className="absolute top-0 left-0 w-3/4 max-w-[300px] h-full bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-gray-800 shadow-2xl shadow-black/20 z-50 flex-col"
        >
            <View className="p-4 pt-6 flex-1">
                <Text className="text-xs font-snpro-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 ml-2">
                    Ajustes de Cuenta
                </Text>

                <AnimatedSquishItem
                    onPress={() => router.push('/profile')}
                    className="bg-primary/10 dark:bg-primary-dark/15 border-primary/20 dark:border-primary-dark/30"
                >
                    <Feather name="user" size={18} color={primaryColor} className="mr-4" />
                    <Text className="text-base font-nunito-bold text-primary dark:text-primary-dark">Mi Perfil</Text>
                    <Feather name="chevron-right" size={18} color={primaryColor} className="ml-auto opacity-60" />
                </AnimatedSquishItem>

                <AnimatedSquishItem
                    onPress={() => router.push('/documents')}
                    className="bg-secondary/10 dark:bg-secondary-dark/15 border-secondary/20 dark:border-secondary-dark/30"
                >
                    <Feather name="folder" size={18} color={secondaryColor} className="mr-4" />
                    <Text className="text-base font-nunito-bold text-secondary dark:text-secondary-dark">Mis Documentos</Text>
                    <Feather name="chevron-right" size={18} color={secondaryColor} className="ml-auto opacity-60" />
                </AnimatedSquishItem>

                <AnimatedSquishItem
                    onPress={() => router.push('/profile/personalization')}
                    className="bg-tertiary/10 dark:bg-tertiary-dark/15 border-tertiary/20 dark:border-tertiary-dark/30"
                >
                    <Feather name="sliders" size={18} color={tertiaryColor} className="mr-4" />
                    <Text className="text-base font-nunito-bold text-tertiary dark:text-tertiary-dark">Personalización</Text>
                    <Feather name="chevron-right" size={18} color={tertiaryColor} className="ml-auto opacity-60" />
                </AnimatedSquishItem>
            </View>

            <View className="px-4" style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
                <AnimatedSquishItem
                    onPress={signOut}
                    className="bg-warning/10 dark:bg-warning-dark/15 border-warning/20 dark:border-warning-dark/30 justify-center"
                >
                    <Feather name="log-out" size={18} color={warningColor} className="mr-3" />
                    <Text className="text-warning dark:text-warning-dark font-snpro-bold text-base">Cerrar sesión</Text>
                </AnimatedSquishItem>
            </View>

        </Animated.View>
    );
}