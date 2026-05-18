import { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/hooks/useAuth';
import { updateUserPreferences } from '@/src/services/user.service';

export default function PersonalizationScreen() {
  const { setColorScheme } = useColorScheme();
  const router = useRouter();
  const { user } = useAuth();

  const [selectedMode, setSelectedMode] = useState<'light' | 'dark' | 'system'>(
    (user as any)?.preferences?.theme || 'system'
  );

  const handleModeChange = (mode: 'light' | 'dark' | 'system') => {
    setSelectedMode(mode);
    setColorScheme(mode);

    const promise = updateUserPreferences(mode);
    toast.promise(promise, {
      loading: 'Guardando preferencia...',
      success: 'Tema actualizado',
      error: 'Error al guardar el tema',
    });
  };

  const handleSelectWallpaper = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permiso requerido', {
        description: 'Se necesita acceso a la galería',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const promise = updateUserPreferences(undefined, result.assets[0].uri);
      toast.promise(promise, {
        loading: 'Estableciendo fondo...',
        success: 'Fondo de pantalla actualizado',
        error: 'Error al establecer el fondo',
      });
    }
  };

  const currentWallpaper = (user as any)?.preferences?.phoneWallpaperUrl;

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Cabecera */}
      <View className="flex-row items-center px-4 pt-12 pb-4 border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Feather name="arrow-left" size={24} color={selectedMode === 'dark' ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text className="text-2xl ml-4 text-black dark:text-white font-primary">Personalización</Text>
      </View>

      {/* Opciones */}
      <View className="p-6">
        <Text className="text-gray-500 dark:text-gray-400 mb-4 uppercase text-m font-secondary tracking-wider">
          Apariencia
        </Text>

        <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
          
          {/* Toggle Modo Claro */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <View className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg mr-4">
                <Feather name="sun" size={20} color="#d97706" />
              </View>
              <Text className="text-base text-gray-800 dark:text-white font-tertiary">Modo Claro</Text>
            </View>
            <Switch
              value={selectedMode === 'light'}
              onValueChange={() => handleModeChange('light')}
              trackColor={{ false: '#d1d5db', true: '#4f46e5' }}
            />
          </View>

          {/* Toggle Modo Oscuro */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <View className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mr-4">
                <Feather name="moon" size={20} color="#4f46e5" />
              </View>
              <Text className="text-base text-gray-800 dark:text-white font-tertiary">Modo Oscuro</Text>
            </View>
            <Switch
              value={selectedMode === 'dark'}
              onValueChange={() => handleModeChange('dark')}
              trackColor={{ false: '#d1d5db', true: '#4f46e5' }}
            />
          </View>

          {/* Toggle Modo Sistema */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-4">
                <Feather name="smartphone" size={20} color="#007AFF" />
              </View>
              <Text className="text-base text-gray-800 dark:text-white font-tertiary">Usar conf. del sistema</Text>
            </View>
            <Switch
              value={selectedMode === 'system'}
              onValueChange={() => handleModeChange('system')}
              trackColor={{ false: '#d1d5db', true: '#007AFF' }}
            />
          </View>

        </View>
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-2 text-center font-secondary">
            Al seleccionar Usar conf. del sistema, GeckOS ajustará su apariencia automáticamente según el modo de tu dispositivo.
          </Text>
      </View>

      {/* Sección Fondo de los Chats */}
      <View className="px-6 mb-8">
        <Text className="text-gray-500 dark:text-gray-400 mb-4 uppercase text-m font-secondary tracking-wider">
          Fondo de los Chats
        </Text>

        <TouchableOpacity
          onPress={handleSelectWallpaper}
          className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 flex-row items-center"
          activeOpacity={0.7}
        >
          {currentWallpaper ? (
            <Image
              source={{ uri: currentWallpaper }}
              className="w-16 h-16 rounded-xl mr-4"
              resizeMode="cover"
            />
          ) : (
            <View className="w-16 h-16 rounded-xl mr-4 bg-gray-200 dark:bg-gray-700 items-center justify-center">
              <Feather name="image" size={24} color="#9ca3af" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-base text-gray-800 dark:text-white font-tertiary">
              {currentWallpaper ? 'Cambiar fondo' : 'Elegir fondo'}
            </Text>
            <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-secondary">
              {currentWallpaper ? 'Toca para cambiar la imagen de fondo' : 'Selecciona una imagen de la galería'}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
