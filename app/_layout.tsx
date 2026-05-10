import { Stack } from 'expo-router';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { SocketProvider } from '@/src/context/SocketContext';
import { useAuth } from '@/src/hooks/useAuth';

const RootLayout = () => {
  const { user } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      {user ? (
        <SocketProvider userId={user._id}>
          <Stack screenOptions={{ headerShown: false }} />
        </SocketProvider>
      ) : (
        <Stack screenOptions={{ headerShown: false }} />
      )}
      <Toast />
    </View>
  );
};

export default RootLayout;