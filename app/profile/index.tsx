import { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { getUserProfile, updateUserPreferences, deleteAccount, updateProfileData, updatePassword, UserProfile } from '@/src/services/user.service';
import { getErrorMessage } from '@/src/services/api';
import { AxiosError } from 'axios';
import { useAuth } from '@/src/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

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

const AnimatedInput = ({ iconName, placeholder, value, onChangeText, innerRef, returnKeyType, onSubmitEditing, isPassword }: any) => {
  const scale = useSharedValue(1);
  const { colorScheme } = useColorScheme();
  const [showPassword, setShowPassword] = useState(false);
  
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isDark = colorScheme === 'dark';

  return (
    <Animated.View style={animatedStyle} className="mb-4">
      <View className="flex-row items-center bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl px-4 h-14">
        <Ionicons name={iconName} size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        <TextInput
          ref={innerRef}
          className="flex-1 ml-3 text-base font-nunito-bold text-textMain dark:text-textMain-dark"
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => { scale.value = withSpring(1.02, { damping: 12 }); }}
          onBlur={() => { scale.value = withSpring(1); }}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={returnKeyType === 'done'}
          autoCapitalize={isPassword ? 'none' : 'words'}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pl-3 py-2">
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const AnimatedModalButton = ({ onPress, text, isPrimary, isDanger, loading, disabled }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    
    let bgClass = "bg-gray-100 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700";
    let textClass = "text-gray-700 dark:text-gray-300";
    let indicatorColor = "#6B7280";
    
    if (isPrimary) {
        bgClass = "bg-primary/10 dark:bg-primary-dark/15 border border-primary/20 dark:border-primary-dark/30";
        textClass = "text-primary dark:text-primary-dark";
        indicatorColor = "#2A72D4"; // Primary color
    } else if (isDanger) {
        bgClass = "bg-warning/10 dark:bg-warning-dark/15 border border-warning/20 dark:border-warning-dark/30";
        textClass = "text-warning dark:text-warning-dark";
        indicatorColor = "#E14B4B"; // Warning color
    }
  
    return (
      <Animated.View style={[animatedStyle, { flex: 1 }]}>
        <Pressable
          onPressIn={() => { if (!disabled) scale.value = withSpring(0.94, { damping: 15 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
          onPress={onPress}
          disabled={disabled || loading}
          className={`${bgClass} py-4 rounded-xl items-center ${(disabled || loading) ? 'opacity-50' : ''}`}
        >
          {loading ? <ActivityIndicator color={indicatorColor} /> : <Text className={`font-snpro-bold text-base ${textClass}`}>{text}</Text>}
        </Pressable>
      </Animated.View>
    );
};

// 🚀 Avatar con animación de "Respiración" (Breathing Effect)
const BreathingAvatar = ({ uri, initial, onPress }: { uri?: string, initial: string, onPress: () => void }) => {
    const breathe = useSharedValue(1);
    
    useEffect(() => {
        breathe.value = withRepeat(
            withSequence(withTiming(1.05, { duration: 1500 }), withTiming(1, { duration: 1500 })),
            -1, true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

    return (
        <View className="relative mb-6 mt-4">
            <Animated.View 
                style={[animatedStyle, { width: 160, height: 160 }]} 
                className="rounded-full bg-primary/10 dark:bg-primary-dark/20 border-4 border-white dark:border-zinc-800 shadow-lg shadow-primary/20 justify-center items-center overflow-hidden"
            >
                {uri ? (
                    <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <Ionicons name="person" size={72} color="#2A72D4" />
                )}
            </Animated.View>
            <Pressable onPress={onPress} className="absolute bottom-2 right-2 bg-primary dark:bg-primary-dark p-3.5 rounded-full border-4 border-white dark:border-authEnd-dark shadow-sm">
                <Feather name="camera" size={18} color="#fff" />
            </Pressable>
        </View>
    );
};

import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, setUser } = useAuth();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();
  
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Forms state
  const [confirmationText, setConfirmationText] = useState('');
  const [newName, setNewName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [isUpdating, setIsUpdating] = useState(false);

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
            if (data.avatarUrl) {
              const newUrl = `${data.avatarUrl}?t=${new Date().getTime()}`;
              setProfileData(prev => prev ? { ...prev, avatarUrl: newUrl } : null);
              if (user) setUser({ ...user, avatarUrl: newUrl });
            }
        });
      toast.promise(promise, { loading: 'Actualizando foto...', success: () => '¡Foto actualizada!', error: () => 'Error al subir la foto' });
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    setIsUpdating(true);
    const updatePromise = updateProfileData(profileData!._id, { name: newName })
      .then(() => {
        setProfileData(prev => prev ? { ...prev, name: newName } : null);
        if (user) setUser({ ...user, name: newName });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['userChats'] });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        setShowNameModal(false);
      })
      .finally(() => setIsUpdating(false));

    toast.promise(updatePromise, {
      loading: 'Guardando...',
      success: () => '¡Nombre actualizado!',
      error: () => 'No pudimos guardar los cambios.',
    });
  };

  const handleSavePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      toast.error('Atención', { description: 'Todos los campos son requeridos' });
      return;
    }
    if (currentPassword === newPassword) {
      toast.error('Contraseña idéntica', { description: 'La nueva contraseña no puede ser igual a la actual.' });
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W_]).{6,}$/;
    if (!passwordRegex.test(newPassword.trim())) {
      toast.error('Contraseña débil', { description: 'Mínimo 6 caracteres, mayúsculas, minúsculas y un número o carácter especial.' });
      return;
    }

    setIsUpdating(true);
    const updatePromise = updatePassword(currentPassword, newPassword)
      .then(() => {
        setCurrentPassword('');
        setNewPassword('');
        setShowPasswordModal(false);
      })
      .finally(() => setIsUpdating(false));

    toast.promise(updatePromise, {
      loading: 'Actualizando...',
      success: () => '¡Contraseña actualizada!',
      error: (e) => {
        const msg = getErrorMessage(e as AxiosError);
        if (msg.includes('actual no es correcto') || msg.includes('igual a la actual')) {
            return msg;
        }
        return 'Error al actualizar contraseña. Verifica tu contraseña actual.';
      },
    });
  };

  const handleDeleteAccount = async () => {
    if (!profileData) return;
    const expectedText = `delete_${profileData.name.replace(/\s+/g, '')}`;
    if (confirmationText !== expectedText) return toast.error(`Debes escribir: ${expectedText}`);

    setIsUpdating(true);
    try {
      await deleteAccount(confirmationText);
      setShowDeleteModal(false);
      signOut();
      toast.success('Cuenta eliminada correctamente');
    } catch (error) {
      toast.error('No pudimos eliminar tu cuenta', { description: getErrorMessage(error as AxiosError) });
      setIsUpdating(false);
    }
  };

  const passRef = useRef<TextInput>(null);

  if (isLoading) return <View className="flex-1 bg-white dark:bg-authEnd-dark justify-center items-center"><ActivityIndicator size="large" color="#2A72D4" /></View>;

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      <StatusBar style="light" />
      <View style={{ paddingTop: insets.top }} className="bg-primary dark:bg-primary-dark z-20">
        <View className="flex-row justify-between items-center px-4 py-3">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:opacity-60">
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-2xl font-snpro-bold text-white tracking-tight">Mi Perfil</Text>
          <View className="p-2 -mr-2 opacity-0" pointerEvents="none"><Feather name="arrow-left" size={24} /></View>
        </View>
      </View>

      <View className="flex-1 items-center pt-2">
        
        <BreathingAvatar 
            uri={profileData?.avatarUrl} 
            initial={profileData?.name?.charAt(0) || '?'} 
            onPress={handleUpdateAvatar} 
        />

        <Text className="text-2xl font-snpro-bold text-textMain dark:text-textMain-dark mb-1">{profileData?.name}</Text>
        <Text className="text-base font-nunito-regular text-gray-500 dark:text-gray-400 mb-8">{profileData?.email}</Text>

        <View className="w-full px-4">
            <AnimatedMenuRow 
                icon="person-outline" title="Cambiar Nombre" 
                onPress={() => { setNewName(profileData?.name || ''); setShowNameModal(true); }} 
            />
            <AnimatedMenuRow icon="lock-closed-outline" title="Cambiar Contraseña" onPress={() => { setCurrentPassword(''); setNewPassword(''); setShowPasswordModal(true); }} />
            
            <View className="mt-8">
                <Text className="text-xs font-snpro-bold text-warning/70 dark:text-warning-dark/70 uppercase tracking-widest mb-2 ml-4">
                    Zona de Peligro
                </Text>
                <View className="bg-red-50/50 dark:bg-red-950/10 rounded-3xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                    <AnimatedMenuRow icon="trash-outline" title="Eliminar Cuenta" danger={true} onPress={() => { setConfirmationText(''); setShowDeleteModal(true); }} />
                </View>
            </View>
        </View>

      </View>

      {/* Modal Cambiar Nombre */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-center px-4" onPress={() => setShowNameModal(false)}>
          <Pressable className="bg-white dark:bg-authEnd-dark rounded-3xl p-6" onPress={(e) => e.stopPropagation()}>
            <Text className="text-xl font-snpro-bold text-textMain dark:text-textMain-dark mb-6">Cambiar Nombre</Text>
            
            <AnimatedInput
                iconName="person-outline"
                placeholder="¿Cómo quieres que te llamen?"
                value={newName}
                onChangeText={setNewName}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
            />

            <View className="flex-row gap-3 mt-4">
              <AnimatedModalButton onPress={() => setShowNameModal(false)} text="Cancelar" />
              <AnimatedModalButton onPress={handleSaveName} text="Guardar" isPrimary loading={isUpdating} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Cambiar Contraseña */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-center px-4" onPress={() => setShowPasswordModal(false)}>
          <Pressable className="bg-white dark:bg-authEnd-dark rounded-3xl p-6" onPress={(e) => e.stopPropagation()}>
            <Text className="text-xl font-snpro-bold text-textMain dark:text-textMain-dark mb-6">Cambiar Contraseña</Text>
            
            <AnimatedInput
                iconName="lock-closed-outline"
                placeholder="Contraseña Actual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                isPassword={true}
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
            />

            <AnimatedInput
                iconName="key-outline"
                placeholder="Nueva Contraseña"
                value={newPassword}
                onChangeText={setNewPassword}
                isPassword={true}
                innerRef={passRef}
                returnKeyType="done"
                onSubmitEditing={handleSavePassword}
            />

            <View className="flex-row gap-3 mt-4">
              <AnimatedModalButton onPress={() => setShowPasswordModal(false)} text="Cancelar" />
              <AnimatedModalButton onPress={handleSavePassword} text="Actualizar" isPrimary loading={isUpdating} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
                    delete_{profileData?.name?.replace(/\s+/g, '')}
                </Text>
            </View>

            <AnimatedInput
                iconName="trash-outline"
                placeholder="Escribe el código aquí..."
                value={confirmationText}
                onChangeText={setConfirmationText}
                returnKeyType="done"
                onSubmitEditing={handleDeleteAccount}
            />

            <View className="flex-row gap-3 mt-4">
              <AnimatedModalButton onPress={() => setShowDeleteModal(false)} text="Cancelar" />
              <AnimatedModalButton onPress={handleDeleteAccount} text="Eliminar" isDanger loading={isUpdating} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}
