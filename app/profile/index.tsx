import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { getUserProfile, updateUserPreferences, deleteAccount, UserProfile } from '@/src/services/user.service';
import { getErrorMessage } from '@/src/services/api';
import { AxiosError } from 'axios';
import { useAuth } from '@/src/hooks/useAuth';

const AnimatedMenuRow = ({ icon, title, onPress, danger }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { colorScheme } = useColorScheme();
  const iconColor = danger ? '#E14B4B' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280');
  const textColor = danger ? 'text-warning dark:text-warning-dark' : 'text-textMain dark:text-textMain-dark';

  return (
    <Animated.View style={animatedStyle} className="w-full">
      <Pressable
        onPressIn={() => scale.value = withSpring(0.96, { damping: 15 })}
        onPressOut={() => scale.value = withSpring(1, { damping: 15 })}
        onPress={onPress}
        className={`flex-row items-center px-4 py-4 border-gray-100 dark:border-zinc-800/60 ${danger ? '' : 'border-b'}`}
      >
        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${danger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-zinc-800'}`}>
            <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text className={`flex-1 text-base font-nunito-bold ${textColor}`}>{title}</Text>
        <Feather name="chevron-right" size={20} color={colorScheme === 'dark' ? '#4B5563' : '#D1D5DB'} />
      </Pressable>
    </Animated.View>
  );
};

// 🚀 Avatar con animación de "Respiración" (Breathing Effect)
const BreathingAvatar = ({ uri, initial, onPress }: { uri?: string, initial: string, onPress: () => void }) => {
    const breathe = useSharedValue(1);
    
    useEffect(() => {
        breathe.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1500 }),
                withTiming(1, { duration: 1500 })
            ),
            -1, // Infinito
            true // Reversa
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breathe.value }]
    }));

    return (
        <View className="relative mb-6 mt-4">
            <Animated.View 
                style={[animatedStyle, { width: 160, height: 160 }]} 
                className="rounded-full bg-primary/10 dark:bg-primary-dark/20 border-4 border-white dark:border-zinc-800 shadow-lg shadow-primary/20 justify-center items-center overflow-hidden"
            >
                {uri ? (
                    <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <Text className="text-5xl font-snpro-bold text-primary dark:text-primary-dark">{initial}</Text>
                )}
            </Animated.View>
            <Pressable 
                onPress={onPress} 
                className="absolute bottom-2 right-2 bg-primary dark:bg-primary-dark p-3.5 rounded-full border-4 border-white dark:border-authEnd-dark shadow-sm"
            >
                <Feather name="camera" size={18} color="#fff" />
            </Pressable>
        </View>
    );
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, setUser } = useAuth();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getUserProfile().then(setProfileData).catch((e) => toast.error('Error al cargar el perfil', { description: getErrorMessage(e as AxiosError) })).finally(() => setIsLoading(false));
  }, []);

  const handleUpdateAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return toast.error('Permiso requerido', { description: 'Necesitamos acceso a tu galería para cambiar tu foto.' });

    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const promise = updateUserPreferences(undefined, undefined, result.assets[0].uri)
        .then((data) => {
            setProfileData(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
            if (user) setUser({ ...user, avatarUrl: data.avatarUrl });
        });
      toast.promise(promise, { 
        loading: 'Actualizando foto...', 
        success: () => '¡Foto actualizada!', 
        error: () => 'Error al subir la foto' 
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!profileData) return;
    const expectedText = `delete_${profileData.nombre.replace(/\s+/g, '')}`;
    if (confirmationText !== expectedText) return toast.error(`Debes escribir: ${expectedText}`);

    setIsDeleting(true);
    try {
      await deleteAccount(confirmationText);
      setShowDeleteModal(false);
      signOut();
      toast.success('Cuenta eliminada correctamente');
    } catch (error) {
      toast.error('No pudimos eliminar tu cuenta', { description: getErrorMessage(error as AxiosError) });
      setIsDeleting(false);
    }
  };

  if (isLoading) return <View className="flex-1 bg-white dark:bg-authEnd-dark justify-center items-center"><ActivityIndicator size="large" color="#2A72D4" /></View>;

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      
      <View style={{ paddingTop: insets.top }} className="bg-white dark:bg-authEnd-dark z-20">
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:opacity-60">
            <Feather name="arrow-left" size={24} color={colorScheme === 'dark' ? '#E5E7EB' : '#333333'} />
          </Pressable>
          <Text className="text-2xl font-snpro-bold text-textMain dark:text-textMain-dark tracking-tight">Mi Perfil</Text>
          <View className="p-2 -mr-2 opacity-0" pointerEvents="none"><Feather name="arrow-left" size={24} /></View>
        </View>
      </View>

      <View className="flex-1 items-center pt-2">
        
        {/* 🚀 Avatar Animado (160px forzados) */}
        <BreathingAvatar 
            uri={profileData?.avatarUrl} 
            initial={profileData?.nombre?.charAt(0) || '?'} 
            onPress={handleUpdateAvatar} 
        />

        <Text className="text-2xl font-snpro-bold text-textMain dark:text-textMain-dark mb-1">{profileData?.nombre}</Text>
        <Text className="text-base font-nunito-regular text-gray-500 dark:text-gray-400 mb-8">{profileData?.email}</Text>

        <View className="w-full px-4">
            <AnimatedMenuRow 
                icon="person-outline" title="Editar Información" 
                onPress={() => router.push({ pathname: '/profile/edit', params: { id: profileData?._id, nombre: profileData?.nombre, email: profileData?.email } })} 
            />
            <AnimatedMenuRow icon="lock-closed-outline" title="Cambiar Contraseña" onPress={() => router.push('/profile/change-password')} />
            
            {/* 🚀 ZONA DE PELIGRO */}
            <View className="mt-8">
                <Text className="text-xs font-snpro-bold text-warning/70 dark:text-warning-dark/70 uppercase tracking-widest mb-2 ml-4">
                    Zona de Peligro
                </Text>
                <View className="bg-red-50/50 dark:bg-red-950/10 rounded-3xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                    <AnimatedMenuRow icon="trash-outline" title="Eliminar Cuenta" danger={true} onPress={() => setShowDeleteModal(true)} />
                </View>
            </View>
        </View>

      </View>

      {/* Modal de Borrado */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-center px-4" onPress={() => setShowDeleteModal(false)}>
          <Pressable className="bg-white dark:bg-authEnd-dark rounded-3xl p-6" onPress={(e) => e.stopPropagation()}>
            <View className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full justify-center items-center self-center mb-4">
                <Ionicons name="warning" size={28} color="#E14B4B" />
            </View>
            <Text className="text-xl font-snpro-bold text-center text-textMain dark:text-textMain-dark mb-2">¿Eliminar tu cuenta?</Text>
            <Text className="text-center font-nunito-regular text-gray-500 dark:text-gray-400 mb-6 leading-6">
                Esta acción es <Text className="font-nunito-bold text-warning dark:text-warning-dark">irreversible</Text>. Escribe el siguiente código de confirmación:
            </Text>
            
            <View className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-xl mb-4 items-center">
                <Text className="font-monospace text-base tracking-widest text-textMain dark:text-textMain-dark">
                    delete_{profileData?.nombre?.replace(/\s+/g, '')}
                </Text>
            </View>

            <TextInput
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 text-base mb-6 text-textMain dark:text-textMain-dark"
              placeholder="Escribe el código aquí..."
              placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
              value={confirmationText}
              onChangeText={setConfirmationText}
              autoCapitalize="none"
            />

            <View className="flex-row gap-3">
              <Pressable onPress={() => setShowDeleteModal(false)} className="flex-1 bg-gray-100 dark:bg-zinc-800 py-4 rounded-xl items-center">
                <Text className="font-snpro-bold text-gray-700 dark:text-gray-300 text-base">Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleDeleteAccount} disabled={isDeleting} className={`flex-1 bg-warning dark:bg-warning-dark py-4 rounded-xl items-center ${isDeleting ? 'opacity-50' : ''}`}>
                {isDeleting ? <ActivityIndicator color="#fff" /> : <Text className="font-snpro-bold text-white text-base">Eliminar</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}