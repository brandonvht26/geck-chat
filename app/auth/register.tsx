import { useCallback, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { useFocusEffect, useRouter } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { registerSchema } from '@/src/schemas/auth.schema';
import { useAuth } from '@/src/hooks/useAuth';
import { Feather } from '@expo/vector-icons';
import { toast } from 'sonner-native';

export default function RegisterScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { signUp, loading } = useAuth(); // Asegúrate de usar el método de registro de tu contexto

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);

  const nameScale = useSharedValue(1);
  const emailScale = useSharedValue(1);
  const passwordScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const nameStyle = useAnimatedStyle(() => ({ transform: [{ scale: nameScale.value }] }));
  const emailStyle = useAnimatedStyle(() => ({ transform: [{ scale: emailScale.value }] }));
  const passwordStyle = useAnimatedStyle(() => ({ transform: [{ scale: passwordScale.value }] }));
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      const cleanData = {
        name: value.name.trim(),
        email: value.email.trim().toLowerCase(),
        password: value.password.trim()
      };

      if (!cleanData.name || !cleanData.email || !cleanData.password) {
        toast.error('Por favor, completa todos los campos correctamente.');
        return;
      }

      try {
        const parsedData = registerSchema.parse(cleanData);
        await signUp(parsedData.name, parsedData.email, parsedData.password);

        toast.success('¡Cuenta creada con éxito! Bienvenido a Geck Chat.');
        router.replace('/home');
      } catch (error: any) {
        const errorMsg = error?.message?.toLowerCase() || error?.response?.data?.message?.toLowerCase() || '';

        if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
          toast.error('Sin conexión a internet. Revisa tu red.');
        } else if (errorMsg.includes('exists') || errorMsg.includes('already in use') || errorMsg.includes('duplicado')) {
          toast.error('Este correo ya está registrado. Intenta iniciar sesión.');
        } else if (errorMsg.includes('timeout')) {
          toast.error('El servidor tardó mucho en responder. Intenta de nuevo.');
        } else {
          toast.error(error.message || 'Ocurrió un error al crear la cuenta.');
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
      source={require('../../assets/wallpapers/auth/register.webp')} 
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View className="flex-1 bg-black/60 justify-start px-6" style={{ paddingTop: 120 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          <Animated.View 
            entering={FadeInDown.delay(100).duration(500).springify()} 
            className="mb-10 items-center"
          >
            <Text 
              className="text-4xl text-white tracking-widest text-center font-primary leading-[50px]" 
              style={{ includeFontPadding: false }}
            >
              Registrarse
            </Text>
          </Animated.View>

          <View className="bg-white/10 rounded-3xl p-6 border border-white/25">

            <Animated.View entering={FadeInDown.delay(200).duration(500).springify()}>
              <Animated.View style={nameStyle} className="mb-4">
                <form.Field name="name">
                  {(field) => (
                    <>
                      <View className="flex-row items-center bg-black/30 rounded-3xl px-4 py-1 border border-white/20">
                        <Feather name="user" size={20} color="#9ca3af" />
                        <TextInput
                          className="flex-1 ml-3 text-white text-base font-tertiary"
                          placeholder="Nombre completo"
                          placeholderTextColor="#9ca3af"
                          value={field.state.value}
                          onChangeText={field.handleChange}
                          onFocus={() => { nameScale.value = withTiming(1.02, { duration: 200 }); }}
                          onBlur={() => { nameScale.value = withTiming(1, { duration: 200 }); field.handleBlur(); }}
                          returnKeyType="next"
                          onSubmitEditing={() => emailRef.current?.focus()}
                          blurOnSubmit={false}
                        />
                      </View>
                      {field.state.meta.errors.length > 0 && (
                        <Text className="text-red-400 text-xs mt-1 ml-2 font-tertiary">{field.state.meta.errors[0]}</Text>
                      )}
                    </>
                  )}
                </form.Field>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(500).springify()}>
              <Animated.View style={emailStyle} className="mb-4">
                <form.Field name="email">
                  {(field) => (
                    <>
                      <View className="flex-row items-center bg-black/30 rounded-3xl px-4 py-1 border border-white/20">
                        <Feather name="mail" size={20} color="#9ca3af" />
                        <TextInput
                          ref={emailRef}
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
                        <Text className="text-red-400 text-xs mt-1 ml-2 font-tertiary">{field.state.meta.errors[0]}</Text>
                      )}
                    </>
                  )}
                </form.Field>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(500).springify()}>
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
                        <Text className="text-red-400 text-xs mt-1 ml-2 font-tertiary">{field.state.meta.errors[0]}</Text>
                      )}
                    </>
                  )}
                </form.Field>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(500).springify()}>
              <Animated.View style={buttonStyle} className="mb-4">
                <Pressable
                  onPress={() => form.handleSubmit()}
                  onPressIn={() => { buttonScale.value = withSpring(0.95); }}
                  onPressOut={() => { buttonScale.value = withSpring(1); }}
                  className="bg-primary/70 dark:bg-primary-dark/70 rounded-3xl py-3 items-center"
                  disabled={loading}
                >
                  <Text className="text-white font-tertiary text-lg">{loading ? 'Procesando...' : 'Comenzar'}</Text>
                </Pressable>
              </Animated.View>
            </Animated.View>

          </View>

          <Animated.View entering={FadeInDown.delay(600).duration(500).springify()} className="flex-row justify-center mt-8">
            <Text className="text-gray-400 font-tertiary">¿Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text className="text-white underline font-tertiary">Inicia sesión</Text>
            </TouchableOpacity>
          </Animated.View>

        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}