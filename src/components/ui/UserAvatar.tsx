import React from 'react';
import { View, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface UserAvatarProps {
  uri?: string | null;
  size?: number;
  fallbackIcon?: keyof typeof Feather.glyphMap;
}

export const UserAvatar = ({ uri, size = 40, fallbackIcon = 'user' }: UserAvatarProps) => {
  return (
    <View 
      style={{ width: size, height: size, borderRadius: size / 2 }} 
      className="bg-black/30 border border-white/20 items-center justify-center overflow-hidden"
    >
      {uri ? (
        <Image 
          source={{ uri }} 
          style={{ width: '100%', height: '100%' }} 
          resizeMode="cover" 
        />
      ) : (
        <Feather name={fallbackIcon} size={size * 0.5} color="#9ca3af" />
      )}
    </View>
  );
};
