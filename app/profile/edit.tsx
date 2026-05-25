import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { updateProfileData } from '@/src/services/user.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedSquishButton = ({ onPress, text }: { onPress: () => void, text: string }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  
  return (
    <Animated.View style={animatedStyle} className="mt-8">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
        className="bg-primary dark:bg-primary-dark py-4 rounded-2xl items-center shadow-sm shadow-primary/30"
      >
        <Text className="text-white font-snpro-bold text-base">{text}</Text>
      </Pressable>
    </Animated.View>
  );
};

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams<{ id: string; nombre: string; email: string }>();
  const queryClient = useQueryClient();

  const [nombre, setNombre] = useState(params.nombre || '');
  const [email, setEmail] = useState(params.email || '');

  const handleSave = async () => {
    if (!nombre.trim() || !email.trim()) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    const updatePromise = updateProfileData(params.id, { name: nombre, email })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['userChats'] });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        router.back();
      });

    toast.promise(updatePromise, {
      loading: 'Guardando cambios...',
      success: '¡Perfil actualizado correctamente!',
      error: 'No pudimos guardar los cambios. Inténtalo de nuevo.',
    });
  };

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      {/* 🚀 Header Sincronizado sin comentarios internos de JSX peligrosos */}
      <View style={{ paddingTop: insets.top }} className="bg-white dark:bg-authEnd-dark z-20">
        <View className="flex-row justify-between items-center px-4 py-3 bg-white dark:bg-authEnd-dark border-b border-gray-100 dark:border-gray-800">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Feather name="arrow-left" size={24} color={colorScheme === 'dark' ? '#E5E7EB' : '#141E30'} />
          </Pressable>
          <Text className="text-2xl font-snpro-bold text-textMain dark:text-textMain-dark tracking-tight">
            Editar Perfil
          </Text>
          <View className="p-2 -mr-2 opacity-0" pointerEvents="none">
            <Feather name="arrow-left" size={24} />
          </View>
        </View>
      </View>

      <View className="flex-1 px-6 App-Content pt-6">
        <View className="mb-6">
          <Text className="text-sm font-snpro-bold text-gray-500 dark:text-gray-400 mb-2 ml-1">
            Nombre Público
          </Text>
          <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 h-14">
            <Ionicons name="person-outline" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <TextInput
              className="flex-1 ml-3 text-base font-nunito-bold text-textMain dark:text-textMain-dark"
              placeholder="¿Cómo quieres que te llamen?"
              placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
              value={nombre}
              onChangeText={setNombre}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-snpro-bold text-gray-500 dark:text-gray-400 mb-2 ml-1">
            Correo Electrónico
          </Text>
          <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 h-14">
            <Ionicons name="mail-outline" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <TextInput
              className="flex-1 ml-3 text-base font-nunito-bold text-textMain dark:text-textMain-dark"
              placeholder="tu@correo.com"
              placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <AnimatedSquishButton text="Guardar Cambios" onPress={handleSave} />
      </View>
    </View>
  );
}