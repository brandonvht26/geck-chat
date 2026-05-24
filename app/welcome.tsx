import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind'; // 🚀 Escuchador nativo del tema
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
    Easing
} from 'react-native-reanimated';

const AnimatedSquishButton = ({ onPress, className, children }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View style={animatedStyle} className="w-full">
            <Pressable
                onPressIn={() => { scale.value = withSpring(0.94, { damping: 15, stiffness: 300 }); }}
                onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
                onPress={onPress}
                className={className}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};

export default function WelcomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme(); // 🚀 Hook para detectar modo claro/oscuro
    const floatValue = useSharedValue(0);

    useEffect(() => {
        floatValue.value = withRepeat(
            withSequence(
                withTiming(-12, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1, true
        );
    }, []);

    const animatedImageStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatValue.value }] }));

    // 🚀 Color adaptativo para el logotipo vectorial nativo
    const activeIconColor = colorScheme === 'dark' ? '#8261D4' : '#2A72D4';

  return (
        <SafeAreaView className="flex-1 bg-white dark:bg-authEnd-dark">
            <View 
                className="flex-1 px-8 pt-10 justify-between" 
                style={{ paddingBottom: Math.max(insets.bottom, 20) + 40 }}
            >
                {/* Cabecera / Logo */}
                <Animated.View entering={FadeInDown.delay(100).duration(800)} className="items-center mt-6">
                    <View className="flex-row items-center gap-3">
                        <Ionicons name="chatbubbles" size={44} color={activeIconColor} />
                        <Text className="text-5xl font-nunito-bold text-textMain dark:text-textMain-dark tracking-tight">
                            GeckChat
                        </Text>
                    </View>
                </Animated.View>

                {/* Willy el Gecko */}
                <View className="flex-1 justify-center items-center my-2">
                    <Animated.View style={animatedImageStyle} className="w-full items-center">
                        <Image
                            source={require('@/assets/icons/willy-reception.svg')}
                            style={{ width: 280, height: 280 }}
                            contentFit="contain"
                            transition={500}
                        />
                    </Animated.View>
                </View>

                {/* Textos y Botones */}
                <Animated.View entering={FadeInDown.delay(400).duration(800)} className="w-full">
                    <Text className="text-3xl font-snpro-bold text-center text-textMain dark:text-textMain-dark mb-2">
                        Conecta sin límites
                    </Text>
                    <Text className="text-base font-elms text-center text-gray-500 dark:text-gray-400 mb-8 leading-6 px-2">
                        Colabora, organiza tus proyectos y comunícate con tu equipo de forma rápida, segura y con estilo.
                    </Text>

                    <View className="gap-4">
                        {/* 🚀 Botón Primario: bg-primary (claro) y dark:bg-primary-dark (oscuro) */}
                        <AnimatedSquishButton 
                            onPress={() => router.push('/auth/login')}
                            className="bg-primary dark:bg-primary-dark w-full py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-primary/30 dark:shadow-primary-dark/10"
                        >
                            <Text className="text-white text-lg font-nunito-bold mr-2">
                                Iniciar sesión
                            </Text>
                            <Feather name="log-in" size={20} color="white" />
                        </AnimatedSquishButton>

                        {/* 🚀 Botón Secundario: bg-secondary (claro) y dark:bg-secondary-dark (oscuro) */}
                        <AnimatedSquishButton 
                            onPress={() => router.push('/auth/register')}
                            className="bg-secondary dark:bg-secondary-dark w-full py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-secondary/20 dark:shadow-secondary-dark/10"
                        >
                            <Text className="text-white text-lg font-nunito-bold mr-2">
                                Crear cuenta nueva
                            </Text>
                            <Feather name="user-plus" size={20} color="white" />
                        </AnimatedSquishButton>
                    </View>
                </Animated.View>

            </View>
        </SafeAreaView>
    );
}