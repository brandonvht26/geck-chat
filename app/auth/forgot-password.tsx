import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { useColorScheme } from 'nativewind';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withRepeat, 
    withTiming, 
    Easing, 
    FadeInDown 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const WaveBackground = () => {
    const rotation1 = useSharedValue(0);
    const rotation2 = useSharedValue(0);

    useEffect(() => {
        rotation1.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false);
        rotation2.value = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
    }, []);

    const style1 = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation1.value}deg` }] }));
    const style2 = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation2.value}deg` }] }));

    return (
        <View style={{ position: 'absolute', width, height, overflow: 'hidden', zIndex: -1 }} className="bg-primary dark:bg-primary-dark">
            <Animated.View style={[
                { position: 'absolute', bottom: -height * 0.55, left: -width * 0.5, width: width * 2, height: width * 2, borderRadius: width * 0.85, backgroundColor: 'rgba(255,255,255,0.15)' },
                style1
            ]} />
            <Animated.View style={[
                { position: 'absolute', bottom: -height * 0.6, left: -width * 0.45, width: width * 2, height: width * 2, borderRadius: width * 0.9 },
            ]} className="bg-white dark:bg-authEnd-dark" />
        </View>
    );
};

const AnimatedInput = ({ icon, innerRef, onSubmitEditing, ...props }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View style={animatedStyle} className="mb-4">
            <View className="flex-row items-center bg-white/20 px-4 py-4 rounded-2xl border border-white/30">
                <Feather name={icon} size={20} color="white" className="mr-3" />
                <TextInput
                    ref={innerRef}
                    onFocus={() => { scale.value = withSpring(1.02, { damping: 12 }); }}
                    onBlur={() => { scale.value = withSpring(1); }}
                    onSubmitEditing={onSubmitEditing}
                    className="flex-1 text-white text-base font-nunito-regular"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    {...props}
                />
            </View>
        </Animated.View>
    );
};

const AnimatedSquishButton = ({ onPress, className, children, disabled }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    
    return (
        <Animated.View style={animatedStyle} className="w-full">
            <Pressable
                disabled={disabled}
                onPressIn={() => { scale.value = withSpring(0.94, { damping: 15 }); }}
                onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
                onPress={onPress}
                className={className}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRecover = async () => {
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            toast.error('Por favor, ingresa tu correo electrónico.');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(cleanEmail)) {
            toast.error('El formato no es válido.', { description: 'Usa algo como: tu@correo.com' });
            return;
        }

        try {
            setLoading(true);
            
            // 🚀 TRANSICIÓN PREMIUM: Alerta de confirmación de 2 segundos antes de redirigir al login
            toast.success('Instrucciones enviadas.', { 
                description: 'Por favor, revisa tu correo electrónico para restablecer tu contraseña.' 
            });

            setTimeout(() => {
                router.replace('/auth/login');
            }, 2000);

        } catch (error: any) {
            const errorMsg = error?.message?.toLowerCase() || '';

            if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
                toast.error('Sin conexión a internet.', { description: 'Revisa tu conexión de red.' });
            } else if (errorMsg.includes('not found') || errorMsg.includes('no existe')) {
                toast.error('Cuenta no encontrada.', { description: 'No encontramos ningún usuario con ese correo.' });
            } else {
                toast.error('No se pudo procesar la solicitud.', { description: 'Intenta de nuevo más tarde.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const activeIndicatorColor = colorScheme === 'dark' ? '#8261D4' : '#2A72D4';

    return (
        <View style={{ flex: 1 }}>
            <WaveBackground />
            
            <View className="absolute bottom-0 w-full items-center z-10 pointer-events-auto" style={{ paddingBottom: Math.max(insets.bottom, 20) + 20 }}>
                <Animated.View entering={FadeInDown.delay(400).duration(800)}>
                    <TouchableOpacity onPress={() => router.back()} className="flex-row items-center p-2" activeOpacity={0.7}>
                        <Feather name="arrow-left" size={16} color="#9CA3AF" />
                        <Text className="text-gray-500 dark:text-gray-400 ml-2 underline font-nunito-bold">
                            Volver al inicio de sesión
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                <View className="flex-1 px-8 justify-center" style={{ paddingTop: insets.top }}>
                    
                    <Animated.View entering={FadeInDown.delay(100).duration(800)} className="mb-6">
                        <Text className="text-4xl font-snpro-bold text-white mb-2 tracking-tight">Recuperar</Text>
                        <Text className="text-base font-nunito-regular text-white/80 leading-6">
                            Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                        <AnimatedInput 
                            icon="mail"
                            placeholder="Correo electrónico"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            returnKeyType="done"
                            onSubmitEditing={handleRecover}
                        />

                        <AnimatedSquishButton 
                            onPress={handleRecover}
                            disabled={loading}
                            className="bg-white border-2 border-primary dark:border-primary-dark dark:bg-authEnd-dark w-full py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-black/10 mt-4"
                        >
                            {loading ? (
                                <ActivityIndicator color={activeIndicatorColor} />
                            ) : (
                                <Text className="text-primary dark:text-primary-dark text-lg font-nunito-bold">
                                    Enviar instrucciones
                                </Text>
                            )}
                        </AnimatedSquishButton>
                    </Animated.View>

                </View>
            </KeyboardAvoidingView>
        </View>
    );
}