import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { toast } from 'sonner-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const emailScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const emailStyle = useAnimatedStyle(() => ({ transform: [{ scale: emailScale.value }] }));
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  const handleRecover = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      toast.error('Por favor, ingresa tu correo electrónico.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      toast.error('El formato no es válido. Usa algo como: tu@correo.com');
      return;
    }

    try {
      // Aquí va tu lógica de recuperación real
      toast.success('Instrucciones enviadas. Revisa tu bandeja de entrada.');

      setTimeout(() => {
        router.back();
      }, 2000);

    } catch (error: any) {
      const errorMsg = error?.message?.toLowerCase() || '';

      if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
        toast.error('Sin conexión a internet. Revisa tu red.');
      } else if (errorMsg.includes('not found') || errorMsg.includes('no existe')) {
        toast.error('No encontramos ninguna cuenta con ese correo.');
      } else {
        toast.error('No se pudo procesar la solicitud en este momento.');
      }
    }
  };

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
      source={require('../../assets/wallpapers/auth/recoverPassword.webp')} 
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View className="flex-1 bg-black/60 justify-start px-6" style={{ paddingTop: 120 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          
          <Animated.View 
            entering={FadeInDown.delay(100).duration(500).springify()} 
            className="mb-10 items-center"
          >
            <Text className="text-4xl text-white tracking-widest text-center font-primary">Recuperar Contraseña</Text>
          </Animated.View>

          <View className="bg-white/10 rounded-3xl p-6 border border-white/25">
            
            <Text className="text-white text-sm mb-6 text-center font-tertiary">
              Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
            </Text>

            <Animated.View entering={FadeInDown.delay(200).duration(500).springify()}>
              <Animated.View style={emailStyle} className="mb-8">
                <View className="flex-row items-center bg-black/30 rounded-3xl px-4 py-1 border border-white/20">
                  <Feather name="mail" size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base font-tertiary"
                    placeholder="Correo electrónico"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => { emailScale.value = withTiming(1.02, { duration: 200 }); }}
                    onBlur={() => { emailScale.value = withTiming(1, { duration: 200 }); }}
                    returnKeyType="done"
                    onSubmitEditing={handleRecover}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(500).springify()}>
              <Animated.View style={buttonStyle} className="mb-4">
                <Pressable
                  onPress={handleRecover}
                  onPressIn={() => { buttonScale.value = withSpring(0.95); }}
                  onPressOut={() => { buttonScale.value = withSpring(1); }}
                  className="bg-primary/70 dark:bg-primary-dark/70 rounded-3xl py-3 items-center"
                >
                  <Text className="text-white font-tertiary text-lg">Enviar Instrucciones</Text>
                </Pressable>
              </Animated.View>
            </Animated.View>

          </View>

          <Animated.View entering={FadeInDown.delay(400).duration(500).springify()} className="flex-row justify-center mt-8">
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
              <Feather name="arrow-left" size={16} color="#e8edf5" />
              <Text className="text-gray-300 ml-2 underline font-tertiary">Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </Animated.View>

        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}