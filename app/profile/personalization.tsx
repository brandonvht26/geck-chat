import { useState, useEffect } from 'react';
import { View, Text, Switch, Pressable, Image, Modal } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/hooks/useAuth';
import { updateUserPreferences } from '@/src/services/user.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

const bundledWallpapers = {
  primary: require('../../assets/wallpapers/primary.webp'),
  secondary: require('../../assets/wallpapers/secondary.webp'),
  tertiary: require('../../assets/wallpapers/tertiary.webp'),
};

const AnimatedSquishItem = ({ onPress, className, children }: { onPress: () => void, className: string, children: React.ReactNode }) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    
    return (
        <Animated.View style={animatedStyle} className="w-full">
            <Pressable
                onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
                onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
                onPress={onPress}
                className={className}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};

export default function PersonalizationScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();
  
  const tertiaryColor = colorScheme === 'dark' ? '#BBE068' : '#93BE38';

  const [selectedMode, setSelectedMode] = useState<'light' | 'dark' | 'system'>(
    (user as any)?.preferences?.theme || 'system'
  );
  
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);

  useEffect(() => {
    if ((user as any)?.preferences?.theme) {
      setSelectedMode((user as any).preferences.theme);
    }
  }, [(user as any)?.preferences?.theme]);

  const handleModeChange = (mode: 'light' | 'dark' | 'system') => {
    setSelectedMode(mode);
    setColorScheme(mode);

    setTimeout(() => {
      const promise = updateUserPreferences(mode)
        .then((data) => {
          if (user && data.preferences) {
            setUser({ ...user, preferences: data.preferences });
          }
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        })
        .catch((error: any) => {
          console.error('🛑 ERROR EN TEMA:', error.response?.data || error.message);
          throw error; 
        });

      toast.promise(promise, {
        loading: 'Guardando configuración...',
        success: () => '¡Apariencia actualizada correctamente!',
        error: () => 'Error al guardar. Inténtalo de nuevo.'
      });
    }, 150);
  };

  const handleDarkSwitch = (wantsDark: boolean) => {
    handleModeChange(wantsDark ? 'dark' : 'light');
  };

  const handleSystemSwitch = (wantsSystem: boolean) => {
    if (wantsSystem) {
      handleModeChange('system');
    } else {
      handleModeChange(colorScheme === 'dark' ? 'dark' : 'light');
    }
  };

  const handleWallpaperSelection = async (type: 'primary' | 'secondary' | 'tertiary' | 'gallery') => {
    setShowWallpaperModal(false);
    let wallpaperPayload: string | undefined = undefined;

    if (type === 'gallery') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.error('Permiso denegado', { description: 'Necesitamos acceso a tus fotos.' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
      if (result.canceled || !result.assets[0]) return;
      wallpaperPayload = result.assets[0].uri;
    } else {
      wallpaperPayload = `bundled:${type}`;
    }

    const promise = updateUserPreferences(undefined, wallpaperPayload)
      .then((data) => {
        if (user && data.preferences) {
          setUser({ ...user, preferences: data.preferences });
        }
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      });

    toast.promise(promise, {
      loading: 'Actualizando fondo...',
      success: () => '¡Fondo de chat actualizado!',
      error: () => 'No pudimos guardar tu fondo. Inténtalo de nuevo.'
    });
  };

  const currentWallpaper = (user as any)?.preferences?.phoneWallpaperUrl;

  const renderWallpaperThumbnail = () => {
    if (!currentWallpaper) {
      return (
        <View className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 items-center justify-center border border-gray-200 dark:border-zinc-700">
          <Ionicons name="image-outline" size={28} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        </View>
      );
    }
    if (currentWallpaper.startsWith('bundled:')) {
      const type = currentWallpaper.split(':')[1] as 'primary' | 'secondary' | 'tertiary';
      return (
        <Image source={bundledWallpapers[type]} className="w-16 h-16 rounded-2xl" resizeMode="cover" />
      );
    }
    return (
      <Image source={{ uri: currentWallpaper }} className="w-16 h-16 rounded-2xl" resizeMode="cover" />
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      
      <StatusBar style="light" />
      {/* 🚀 Header Pixel-Perfect (Réplica 1:1 de MainHeader) */}
      <View style={{ paddingTop: insets.top }} className="bg-tertiary dark:bg-tertiary-dark z-20">
        <View className="flex-row justify-between items-center px-4 py-3">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:opacity-60">
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>

          <Text className="text-2xl font-snpro-bold text-white tracking-tight">
            Personalización
          </Text>

          {/* View Fantasma para equilibrar matemáticamente el centro */}
          <View className="p-2 -mr-2 opacity-0" pointerEvents="none">
            <Feather name="arrow-left" size={24} />
          </View>
        </View>
      </View>

      <View className="flex-1 px-4 pt-6">
        
        <View className="flex-row items-center mb-4 ml-2">
          <Ionicons name="color-palette-outline" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <Text className="text-sm font-snpro-bold text-gray-500 dark:text-gray-400 ml-2">
            Apariencia global
          </Text>
        </View>

        <View className="bg-gray-50 dark:bg-zinc-800/50 rounded-3xl p-2 mb-8 border border-gray-100 dark:border-zinc-800">
          <View className="flex-row justify-between items-center p-3 border-b border-gray-200/50 dark:border-zinc-700/50">
            <View className="flex-row items-center">
              <View className="bg-tertiary/10 dark:bg-tertiary-dark/15 p-2.5 rounded-xl mr-4">
                <Feather name="moon" size={20} color={tertiaryColor} />
              </View>
              <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark">Modo Oscuro</Text>
            </View>
            <Switch
              value={selectedMode === 'dark' || (selectedMode === 'system' && colorScheme === 'dark')}
              onValueChange={handleDarkSwitch}
              trackColor={{ false: '#d1d5db', true: tertiaryColor }}
            />
          </View>

          <View className="flex-row justify-between items-center p-3">
            <View className="flex-row items-center">
              <View className="bg-tertiary/10 dark:bg-tertiary-dark/15 p-2.5 rounded-xl mr-4">
                <Feather name="smartphone" size={20} color={tertiaryColor} />
              </View>
              <View>
                <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark">Conf. del sistema</Text>
                <Text className="text-xs font-nunito-regular text-gray-400 dark:text-gray-500 mt-0.5">Automático según dispositivo</Text>
              </View>
            </View>
            <Switch
              value={selectedMode === 'system'}
              onValueChange={handleSystemSwitch}
              trackColor={{ false: '#d1d5db', true: tertiaryColor }}
            />
          </View>
        </View>

        <View className="flex-row items-center mb-4 ml-2">
          <Ionicons name="image-outline" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          <Text className="text-sm font-snpro-bold text-gray-500 dark:text-gray-400 ml-2">
            Fondo de pantalla
          </Text>
        </View>

        <AnimatedSquishItem 
          onPress={() => setShowWallpaperModal(true)}
          className="bg-gray-50 dark:bg-zinc-800/50 rounded-3xl p-4 flex-row items-center border border-gray-100 dark:border-zinc-800"
        >
          {renderWallpaperThumbnail()}
          <View className="flex-1 ml-4">
            <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark">
              Fondo de los chats
            </Text>
            <Text className="text-sm font-nunito-regular text-gray-500 dark:text-gray-400 mt-1">
              Toca para elegir un diseño
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
        </AnimatedSquishItem>
      </View>

      <Modal visible={showWallpaperModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowWallpaperModal(false)}>
          <Pressable 
            className="bg-white dark:bg-authEnd-dark rounded-t-3xl px-6 pt-6 pb-10" 
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full self-center mb-6" />
            <Text className="text-xl font-snpro-bold text-textMain dark:text-textMain-dark text-center mb-8">
              Elige un fondo
            </Text>

            <View className="flex-row justify-between mb-8 gap-3">
              {(['primary', 'secondary', 'tertiary'] as const).map((type) => (
                <View key={type} className="flex-1">
                  <AnimatedSquishItem onPress={() => handleWallpaperSelection(type)} className="w-full">
                    <View className="w-full aspect-[9/16] rounded-2xl overflow-hidden mb-3 shadow-sm border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">
                      <Image 
                        source={bundledWallpapers[type]} 
                        style={{ width: '100%', height: '100%' }} 
                        resizeMode="cover" 
                      />
                    </View>
                    <Text className="text-sm font-nunito-bold text-center text-textMain dark:text-textMain-dark">
                      {type === 'primary' ? 'Zafiro' : type === 'secondary' ? 'Ámbar' : 'Lima'}
                    </Text>
                  </AnimatedSquishItem>
                </View>
              ))}
            </View>

            <AnimatedSquishItem 
              onPress={() => handleWallpaperSelection('gallery')}
              className="bg-gray-100 dark:bg-zinc-800/80 rounded-2xl py-4 flex-row justify-center items-center border border-gray-200 dark:border-zinc-700"
            >
              <Ionicons name="images" size={20} color={colorScheme === 'dark' ? '#E5E7EB' : '#141E30'} className="mr-3" />
              <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark">Elegir de la galería</Text>
            </AnimatedSquishItem>
            
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}