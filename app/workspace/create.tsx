import { useState } from 'react';
import { View, TextInput, Text, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { createWorkspace } from '@/src/services/workspace.service';

const AnimatedSquishButton = ({ onPress, text, isLoading }: { onPress: () => void, text: string, isLoading: boolean }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  
  return (
    <Animated.View style={animatedStyle} className="mt-8">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
        disabled={isLoading}
        className={`bg-primary dark:bg-primary-dark py-4 rounded-2xl items-center shadow-sm shadow-primary/30 flex-row justify-center ${isLoading ? 'opacity-70' : ''}`}
      >
        {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-snpro-bold text-base">{text}</Text>}
      </Pressable>
    </Animated.View>
  );
};

export default function CreateWorkspaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const goBackSafely = () => router.canGoBack() ? router.back() : router.replace('/');

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Campo requerido', { description: 'El nombre es obligatorio' });
    
    setIsLoading(true);
    try {
      await createWorkspace(name.trim(), description.trim());
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });

      toast.success('El espacio de trabajo ha sido generado');
      setTimeout(() => { goBackSafely(); }, 1500);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al crear el espacio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      <View style={{ paddingTop: insets.top }} className="bg-white dark:bg-authEnd-dark z-20">
        <View className="flex-row justify-between items-center px-4 py-3 bg-white dark:bg-authEnd-dark border-b border-gray-100 dark:border-gray-800">
          <Pressable onPress={goBackSafely} className="p-2 -ml-2 active:opacity-60">
            <Feather name="x" size={24} color={colorScheme === 'dark' ? '#E5E7EB' : '#141E30'} />
          </Pressable>
          <Text className="text-2xl font-snpro-bold text-textMain dark:text-textMain-dark tracking-tight">
            Nuevo Workspace
          </Text>
          <View className="p-2 -mr-2 opacity-0" pointerEvents="none"><Feather name="x" size={24} /></View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 px-6 pt-6">
        <View className="mb-6">
          <Text className="text-sm font-snpro-bold text-gray-500 dark:text-gray-400 mb-2 ml-1">
            Nombre del Equipo *
          </Text>
          <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 h-14">
            <Ionicons name="briefcase-outline" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            <TextInput
              className="flex-1 ml-3 text-base font-nunito-bold text-textMain dark:text-textMain-dark"
              placeholder="Ej. Proyecto Final"
              placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={50}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-snpro-bold text-gray-500 dark:text-gray-400 mb-2 ml-1">
            Descripción
          </Text>
          <View className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 py-3 min-h-[100px]">
            <TextInput
              className="flex-1 text-base font-nunito-regular text-textMain dark:text-textMain-dark"
              placeholder="Describe el propósito del workspace..."
              placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={250}
            />
          </View>
        </View>

        <AnimatedSquishButton text="Crear Workspace" onPress={handleCreate} isLoading={isLoading} />
      </KeyboardAvoidingView>
    </View>
  );
}