import { useState } from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PersonalizationScreen() {
  const { setColorScheme } = useColorScheme();
  const router = useRouter();

  // Estado maestro para controlar la exclusividad de los switches
  const [selectedMode, setSelectedMode] = useState<'light' | 'dark' | 'system'>('system');

  const handleModeChange = (mode: 'light' | 'dark' | 'system') => {
    setSelectedMode(mode);
    setColorScheme(mode);
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Cabecera */}
      <View className="flex-row items-center px-4 pt-12 pb-4 border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Feather name="arrow-left" size={24} color={selectedMode === 'dark' ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4 text-black dark:text-white">Personalización</Text>
      </View>

      {/* Opciones */}
      <View className="p-6">
        <Text className="text-gray-500 dark:text-gray-400 mb-4 uppercase text-xs font-bold tracking-wider">
          Apariencia
        </Text>

        <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
          
          {/* Toggle Modo Claro */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <View className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg mr-4">
                <Feather name="sun" size={20} color="#d97706" />
              </View>
              <Text className="text-base text-gray-800 dark:text-white font-medium">Modo Claro</Text>
            </View>
            <Switch
              value={selectedMode === 'light'}
              onValueChange={() => handleModeChange('light')}
              trackColor={{ false: '#d1d5db', true: '#d97706' }}
            />
          </View>

          {/* Toggle Modo Oscuro */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <View className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg mr-4">
                <Feather name="moon" size={20} color="#4f46e5" />
              </View>
              <Text className="text-base text-gray-800 dark:text-white font-medium">Modo Oscuro</Text>
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
              <Text className="text-base text-gray-800 dark:text-white font-medium">Usar conf. del sistema</Text>
            </View>
            <Switch
              value={selectedMode === 'system'}
              onValueChange={() => handleModeChange('system')}
              trackColor={{ false: '#d1d5db', true: '#007AFF' }}
            />
          </View>

        </View>
        
        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-2 text-center">
          Al seleccionar "Usar conf. del sistema", GeckOS ajustará su apariencia automáticamente según el modo de tu dispositivo.
        </Text>
      </View>
    </View>
  );
}
