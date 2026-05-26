import { useRef, useEffect } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { useForm } from '@tanstack/react-form';
import { registerSchema } from '@/src/schemas/auth.schema';
import { useAuth } from '@/src/hooks/useAuth';
import { useColorScheme } from 'nativewind'; 
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    Easing, 
    FadeInDown 
} from 'react-native-reanimated';
import { AnimatedInput, AnimatedSquishButton } from './login';

const { width, height } = Dimensions.get('window');

const WaveBackgroundSecondary = () => {
    const rotation1 = useSharedValue(0);
    const rotation2 = useSharedValue(0);

    useEffect(() => {
        rotation1.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false);
        rotation2.value = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
    }, []);

    const style1 = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation1.value}deg` }] }));
    const style2 = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation2.value}deg` }] }));

    return (
        <View style={{ position: 'absolute', width, height, overflow: 'hidden', zIndex: -1 }} className="bg-secondary dark:bg-secondary-dark">
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

export default function RegisterScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const { signUp, loading } = useAuth();
    
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);

    const form = useForm({
        defaultValues: { name: '', email: '', password: '' },
        onSubmit: async ({ value }) => {
            const cleanData = {
                name: value.name.trim(),
                email: value.email.trim().toLowerCase(),
                password: value.password.trim()
            };

            if (!cleanData.name || !cleanData.email || !cleanData.password) {
                toast.error('Campos incompletos', { description: 'Por favor, llena todos los datos.' });
                return;
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W_]).{6,}$/;
            if (!passwordRegex.test(cleanData.password)) {
                toast.error('Contraseña débil', { 
                    description: 'Mínimo 6 caracteres, combinando mayúsculas, minúsculas y un número o carácter especial.' 
                });
                return;
            }

            try {
                const parsedData = registerSchema.parse(cleanData);
                await signUp(parsedData.name, parsedData.email, parsedData.password);
                
                // 🚀 TRANSICIÓN PREMIUM: Alerta informativa de 2 segundos antes de redirigir al login
                toast.success('Información registrada', { 
                    description: 'Tu cuenta ha sido creada. Te llegará un correo de verificación en breve.' 
                });
                
                setTimeout(() => {
                    router.replace('/auth/login');
                }, 2000);

            } catch (error: any) {
                const errorMsg = error?.message?.toLowerCase() || error?.response?.data?.message?.toLowerCase() || '';
                if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
                    toast.error('Sin conexión a internet. Revisa tu red.');
                } else if (errorMsg.includes('exists') || errorMsg.includes('already in use') || errorMsg.includes('duplicado')) {
                    toast.error('Este correo ya está registrado.', { description: 'Intenta iniciar sesión.' });
                } else {
                    toast.error('Error al registrarse', { description: error.message || 'Ocurrió un problema.' });
                }
            }
        },
    });

    const activeIndicatorColor = colorScheme === 'dark' ? '#EAA945' : '#D9821E';

    return (
        <View style={{ flex: 1 }}>
            <WaveBackgroundSecondary />
            
            <View className="absolute bottom-0 w-full items-center z-10 pointer-events-auto" style={{ paddingBottom: Math.max(insets.bottom, 20) + 20 }}>
                <Animated.View entering={FadeInDown.delay(500).duration(800)} className="flex-row">
                    <Text className="text-gray-500 dark:text-gray-400 font-elms">¿Ya tienes una cuenta? </Text>
                    <Pressable onPress={() => router.push('/auth/login')} hitSlop={10}>
                        <Text className="text-secondary dark:text-secondary-dark font-nunito-bold underline">Inicia sesión</Text>
                    </Pressable>
                </Animated.View>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                <View className="flex-1 px-8 justify-center" style={{ paddingTop: insets.top }}>
                    <Animated.View entering={FadeInDown.delay(100).duration(800)} className="mb-8">
                        <Text className="text-5xl font-snpro-bold text-white mb-2 tracking-tight">Registro</Text>
                        <Text className="text-lg font-nunito-regular text-white/90">Únete a GeckChat hoy mismo</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).duration(800)}>
                        <form.Field name="name">
                            {(field) => (
                                <View className="mb-2">
                                    <AnimatedInput 
                                        icon="user"
                                        placeholder="Nombre completo"
                                        value={field.state.value}
                                        onChangeText={field.handleChange}
                                        onBlur={field.handleBlur}
                                        returnKeyType="next"
                                        onSubmitEditing={() => emailRef.current?.focus()}
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                        <Text className="text-red-600 font-nunito-bold text-xs ml-2 -mt-2 mb-2 bg-white/80 dark:bg-zinc-800/80 text-red-500 self-start px-2 py-0.5 rounded-full">{field.state.meta.errors[0]}</Text>
                                    )}
                                </View>
                            )}
                        </form.Field>

                        <form.Field name="email">
                            {(field) => (
                                <View className="mb-2">
                                    <AnimatedInput 
                                        icon="mail"
                                        innerRef={emailRef}
                                        placeholder="Correo electrónico"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={field.state.value}
                                        onChangeText={field.handleChange}
                                        onBlur={field.handleBlur}
                                        returnKeyType="next"
                                        onSubmitEditing={() => passwordRef.current?.focus()}
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                        <Text className="text-red-600 font-nunito-bold text-xs ml-2 -mt-2 mb-2 bg-white/80 dark:bg-zinc-800/80 text-red-500 self-start px-2 py-0.5 rounded-full">{field.state.meta.errors[0]}</Text>
                                    )}
                                </View>
                            )}
                        </form.Field>

                        <form.Field name="password">
                            {(field) => (
                                <View className="mb-4">
                                    <AnimatedInput 
                                        icon="lock"
                                        innerRef={passwordRef}
                                        placeholder="Contraseña"
                                        isPassword={true}
                                        value={field.state.value}
                                        onChangeText={field.handleChange}
                                        onBlur={field.handleBlur}
                                        returnKeyType="done"
                                        onSubmitEditing={() => form.handleSubmit()}
                                    />
                                    {field.state.meta.errors.length > 0 && (
                                        <Text className="text-red-600 font-nunito-bold text-xs ml-2 -mt-2 mb-2 bg-white/80 dark:bg-zinc-800/80 text-red-500 self-start px-2 py-0.5 rounded-full">{field.state.meta.errors[0]}</Text>
                                    )}
                                </View>
                            )}
                        </form.Field>

                        <AnimatedSquishButton 
                            onPress={() => form.handleSubmit()}
                            disabled={loading}
                            className="bg-white border-2 border-secondary dark:border-secondary-dark dark:bg-authEnd-dark w-full py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-black/10 mt-4"
                        >
                            {loading ? (
                                <ActivityIndicator color={activeIndicatorColor} />
                            ) : (
                                <Text className="text-secondary dark:text-secondary-dark text-lg font-nunito-bold">Crear cuenta</Text>
                            )}
                        </AnimatedSquishButton>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}