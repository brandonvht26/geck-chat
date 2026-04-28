import { Stack } from 'expo-router';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

const RootLayout = () => {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast />
    </View>
  );
};

export default RootLayout;