import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

interface MainHeaderProps {
  onToggleMenu: () => void;
}

export default function MainHeader({ onToggleMenu }: MainHeaderProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  
  // 🚀 Sincronización precisa de color de iconos basada en tu tema
  const iconColor = colorScheme === 'dark' ? '#E5E7EB' : '#333333';

  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-white dark:bg-authEnd-dark border-b border-gray-100 dark:border-gray-800">
      
      <TouchableOpacity 
        onPress={onToggleMenu} 
        className="p-2 -ml-2 active:opacity-60"
      >
        <Feather name="menu" size={24} color={iconColor} />
      </TouchableOpacity>

      {/* 🚀 Tipografía corporativa alineada con el SplashScreen */}
      <Text className="text-2xl font-snpro-bold text-textMain dark:text-textMain-dark tracking-tight">
        GeckChat
      </Text>

      <TouchableOpacity 
        onPress={() => router.push('/search')} 
        className="p-2 -mr-2 active:opacity-60"
      >
        <Feather name="search" size={24} color={iconColor} />
      </TouchableOpacity>

    </View>
  );
}