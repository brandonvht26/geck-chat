import { useCallback, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { useFocusEffect, useRouter } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { loginSchema } from '@/src/schemas/auth.schema';
import { useAuth } from '@/src/hooks/useAuth';
import { Feather } from '@expo/vector-icons';
import { toast } from 'sonner-native';

export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { signIn, loading } = useAuth();

  const passwordRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);

  const emailScale = useSharedValue(1);
  const passwordScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const emailStyle = useAnimatedStyle(() => ({ transform: [{ scale: emailScale.value }] }));
  const passwordStyle = useAnimatedStyle(() => ({ transform: [{ scale: passwordScale.value }] }));
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      try {
        const parsedData = loginSchema.parse(value);
        await signIn(parsedData.email, parsedData.password);

        toast.success('¡Bienvenido de vuelta!');
        router.replace('/home');
      } catch (error: any) {
        const errorMsg = error?.message?.toLowerCase() || error?.response?.data?.message?.toLowerCase() || '';

        if (errorMsg.includes('expirada') || errorMsg.includes('inválida') || errorMsg.includes('sesión')) {
          toast.info('Sesión anterior expirada. Por favor, ingresa tus datos.');
        } else if (errorMsg.includes('network') || errorMsg.includes('network error') || errorMsg.includes('failed to fetch')) {
          toast.error('Sin conexión a internet. Revisa tu red.');
        } else if (errorMsg.includes('not found') || errorMsg.includes('no existe') || errorMsg.includes('user-not-found')) {
          toast.error('El usuario no existe. Verifica tu correo.');
        } else if (errorMsg.includes('password') || errorMsg.includes('credenciales') || errorMsg.includes('invalid-credential') || errorMsg.includes('unauthorized')) {
          toast.error('Correo o contraseña incorrectos.');
        } else if (errorMsg.includes('timeout')) {
          toast.error('El servidor tardó mucho en responder. Intenta de nuevo.');
        } else if (errorMsg.includes('many requests') || errorMsg.includes('rate limit')) {
          toast.error('Demasiados intentos. Por favor, espera unos minutos.');
        } else {
          toast.error(error.message || 'Ocurrió un error inesperado al iniciar sesión.');
        }
      }
    },
  });

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent');
        StatusBar.setTranslucent(true);
      }
    }, [])
  );

  return (
    <ImageBackground 
      source={require('../../assets/wallpapers/auth/login.webp')} 
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <View className="flex-1 bg-black/60 justify-start px-6" style={{ paddingTop: 120 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          <Animated.View 
            entering={FadeInDown.delay(100).duration(500).springify()} 
            className="mb-10 items-center"
          >
            <Text className="text-4xl text-white tracking-widest font-primary">Iniciar Sesión</Text>
          </Animated.View>

          <View className="bg-white/10 rounded-3xl p-6 border border-white/25">

            <Animated.View entering={FadeInDown.delay(200).duration(500).springify()}>
              <Animated.View style={emailStyle} className="mb-4">
                <form.Field name="email">
                  {(field) => (
                    <>
                      <View className="flex-row items-center bg-black/30 rounded-3xl px-4 py-1 border border-white/20">
                        <Feather name="mail" size={20} color="#9ca3af" />
                        <TextInput
                          className="flex-1 ml-3 text-white text-base font-tertiary"
                          placeholder="Correo electrónico"
                          placeholderTextColor="#9ca3af"
                          value={field.state.value}
                          onChangeText={field.handleChange}
                          onFocus={() => { emailScale.value = withTiming(1.02, { duration: 200 }); }}
                          onBlur={() => { emailScale.value = withTiming(1, { duration: 200 }); field.handleBlur(); }}
                          returnKeyType="next"
                          onSubmitEditing={() => passwordRef.current?.focus()}
                          blurOnSubmit={false}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                      </View>
                      {field.state.meta.errors.length > 0 && (
                        <Text className="text-red-400 text-xs mt-1 ml-2">{field.state.meta.errors[0]}</Text>
                      )}
                    </>
                  )}
                </form.Field>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(500).springify()}>
              <Animated.View style={passwordStyle} className="mb-6">
                <form.Field name="password">
                  {(field) => (
                    <>
                      <View className="flex-row items-center bg-black/30 rounded-3xl px-4 py-1 border border-white/20">
                        <Feather name="lock" size={20} color="#9ca3af" />
                        <TextInput
                          ref={passwordRef}
                          className="flex-1 ml-3 text-white text-base font-tertiary"
                          placeholder="Contraseña"
                          placeholderTextColor="#9ca3af"
                          value={field.state.value}
                          onChangeText={field.handleChange}
                          onFocus={() => { passwordScale.value = withTiming(1.02, { duration: 200 }); }}
                          onBlur={() => { passwordScale.value = withTiming(1, { duration: 200 }); field.handleBlur(); }}
                          returnKeyType="done"
                          onSubmitEditing={() => form.handleSubmit()}
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity 
                          onPress={() => setShowPassword(!showPassword)}
                          className="p-1"
                        >
                          <Feather 
                            name={showPassword ? "eye" : "eye-off"}
                            size={20} 
                            color="#9ca3af"
                          />
                        </TouchableOpacity>
                      </View>
                      {field.state.meta.errors.length > 0 && (
                        <Text className="text-red-400 text-xs mt-1 ml-2">{field.state.meta.errors[0]}</Text>
                      )}
                    </>
                  )}
                </form.Field>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(500).springify()}>
              <Animated.View style={buttonStyle} className="mb-4">
                <Pressable
                  onPress={() => form.handleSubmit()}
                  onPressIn={() => { buttonScale.value = withSpring(0.95); }}
                  onPressOut={() => { buttonScale.value = withSpring(1); }}
                  className="bg-primary/70 dark:bg-primary-dark/70 rounded-3xl py-3 items-center"
                  disabled={loading}
                >
                  <Text className="text-white font-tertiary text-lg">{loading ? 'Ingresando...' : 'Ingresar'}</Text>
                </Pressable>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(500).springify()}>
              <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
                <Text className="text-center text-white dark:text-white text-l underline font-tertiary">¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </Animated.View>

          </View>

          <Animated.View entering={FadeInDown.delay(600).duration(500).springify()} className="flex-row justify-center mt-8">
            <Text className="text-gray-400 font-tertiary">¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text className="text-white underline font-tertiary">Regístrate</Text>
            </TouchableOpacity>
          </Animated.View>

        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}