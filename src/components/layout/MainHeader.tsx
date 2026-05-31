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
  
  const iconColor = colorScheme === 'dark' ? '#E5E7EB' : '#333333';

  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-primary dark:bg-primary-dark">
      
      <TouchableOpacity 
        onPress={onToggleMenu} 
        className="p-2 -ml-2 active:opacity-60"
      >
        <Feather name="menu" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Text className="text-2xl font-snpro-bold text-white tracking-tight">
        GeckChat
      </Text>

      {/* 🚀 Botón Global cambiado a "Agregar Usuario" */}
      <TouchableOpacity 
        onPress={() => router.push('/search')} 
        className="p-2 -mr-2 active:opacity-60"
      >
        <Feather name="user-plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

    </View>
  );
}