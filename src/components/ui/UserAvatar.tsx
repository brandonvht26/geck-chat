import React from 'react';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserAvatarProps {
  uri?: string | null;
  size?: number;
  isGroup?: boolean;
}

export const UserAvatar = ({ uri, size = 40, isGroup = false }: UserAvatarProps) => {
  return (
    <View 
      style={{ width: size, height: size, borderRadius: isGroup ? size / 3 : size / 2 }} 
      className={`items-center justify-center overflow-hidden border border-transparent ${!uri ? (isGroup ? 'bg-primary/10 dark:bg-primary-dark/20' : 'bg-gray-100 dark:bg-zinc-800') : 'bg-transparent'}`}
    >
      {uri ? (
        <Image 
          source={{ uri }} 
          style={{ width: '100%', height: '100%' }} 
          resizeMode="cover" 
        />
      ) : (
        <Ionicons name={isGroup ? "people" : "person"} size={size * 0.55} color={isGroup ? "#2A72D4" : "#9CA3AF"} />
      )}
    </View>
  );
};
