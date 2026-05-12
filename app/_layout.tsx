import '../global.css';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '@/src/context/SocketContext';
import { useAuth } from '@/src/hooks/useAuth';

const queryClient = new QueryClient();

const RootLayout = () => {
  const { user } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};

export default RootLayout;