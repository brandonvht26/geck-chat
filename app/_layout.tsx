import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors } from '@/constants/theme';

const RootLayout = () => {
  return (
    <View style={{ backgroundColor: Colors.background, flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
      <Toast />
    </View>
  );
};

export default RootLayout;