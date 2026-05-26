import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { useAuth } from '@/src/hooks/useAuth';
import { getErrorMessage } from '@/src/services/api';
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

export const AnimatedInput = ({ icon, innerRef, isPassword, ...props }: any) => {
    const scale = useSharedValue(1);
    const [showPassword, setShowPassword] = useState(false);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View style={animatedStyle} className="mb-4">
            <View className="flex-row items-center bg-white/20 px-4 py-4 rounded-2xl border border-white/30">
                <Feather name={icon} size={20} color="white" className="mr-3" />
                <TextInput
                    ref={innerRef}
                    onFocus={() => { scale.value = withSpring(1.02, { damping: 12 }); }}
                    onBlur={(e) => { 
                        scale.value = withSpring(1); 
                        if(props.onBlur) props.onBlur(e);
                    }}
                    secureTextEntry={isPassword && !showPassword}
                    className="flex-1 text-white text-base font-nunito-regular"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    {...props}
                />
                {isPassword && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2 -mr-2 ml-1" activeOpacity={0.7}>
                        <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
};

export const AnimatedSquishButton = ({ onPress, className, children, disabled }: any) => {
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

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme(); 
    const { signIn, loading } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const passwordRef = useRef<TextInput>(null);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            toast.error('Campos incompletos', { description: 'Por favor ingresa tu correo y contraseña.' });
            return;
        }
        try {
            await signIn(email, password);
            toast.success('¡Bienvenido de vuelta!');
            // 🚀 CORRECCIÓN DE NAVEGACIÓN: Redirección inmediata al Home tras el éxito
            router.replace('/home');
        } catch (error: any) {
            toast.error('Error de acceso', { description: getErrorMessage(error) });
        }
    };

    const activeIndicatorColor = colorScheme === 'dark' ? '#8261D4' : '#2A72D4';

    return (
        <View style={{ flex: 1 }}>
            <WaveBackground />
            
            <View className="absolute bottom-0 w-full items-center z-10 pointer-events-auto" style={{ paddingBottom: Math.max(insets.bottom, 20) + 20 }}>
                <Animated.View entering={FadeInDown.delay(500).duration(800)} className="flex-row">
                    <Text className="text-gray-500 dark:text-gray-400 font-elms">¿No tienes una cuenta? </Text>
                    <Pressable onPress={() => router.push('/auth/register')} hitSlop={10}>
                        <Text className="text-primary dark:text-primary-dark font-nunito-bold underline">Regístrate</Text>
                    </Pressable>
                </Animated.View>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                <View className="flex-1 px-8 justify-center" style={{ paddingTop: insets.top }}>
                    <Animated.View entering={FadeInDown.delay(100).duration(800)} className="mb-10">
                        <Text className="text-5xl font-snpro-bold text-white mb-2 tracking-tight">GeckChat</Text>
                        <Text className="text-lg font-nunito-regular text-white/80">Inicia sesión para continuar</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).duration(800)}>
                        <AnimatedInput 
                            icon="mail"
                            placeholder="Correo electrónico"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                        />

                        <AnimatedInput 
                            icon="lock"
                            innerRef={passwordRef}
                            placeholder="Contraseña"
                            isPassword={true}
                            value={password}
                            onChangeText={setPassword}
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />

                        <Pressable className="items-end mb-8 mt-2" onPress={() => router.push('/auth/forgot-password')}>
                            <Text className="text-white font-nunito-bold text-sm">¿Olvidaste tu contraseña?</Text>
                        </Pressable>

                        <AnimatedSquishButton 
                            onPress={handleLogin}
                            disabled={loading}
                            className="bg-white border-2 border-primary dark:border-primary-dark dark:bg-authEnd-dark w-full py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-black/10"
                        >
                            {loading ? (
                                <ActivityIndicator color={activeIndicatorColor} />
                            ) : (
                                <Text className="text-primary dark:text-primary-dark text-lg font-nunito-bold">Ingresar</Text>
                            )}
                        </AnimatedSquishButton>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}