import { useEffect } from 'react';
import '../global.css';
import { Stack } from 'expo-router';
import { Toaster } from 'sonner-native'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '@/src/context/SocketContext';
import { useAuth, AuthProvider } from '@/src/hooks/useAuth';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'nativewind';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        const isAuthError = error?.response?.status === 401 || error?.response?.status === 403;
        const isNetworkError = error?.message === 'Network Error';
        if (isAuthError || isNetworkError) return false; 
        return failureCount < 2;
      },
    },
  },
});

function RootLayoutContent() {
  const { user } = useAuth();
  const { colorScheme, setColorScheme } = useColorScheme();

  const [loaded, error] = useFonts({
    'ElmsSans': require('../assets/fonts/ElmsSans-Regular.ttf'),
    'SNPro': require('../assets/fonts/SNPro-Regular.ttf'),
    'Nunito': require('../assets/fonts/Nunito-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    if (user?.preferences?.theme) {
      setColorScheme(user.preferences.theme as 'light' | 'dark' | 'system');
    }
  }, [user?.preferences?.theme]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {user ? (
        <SocketProvider userId={user._id}>
          <Stack screenOptions={{ headerShown: false }} />
        </SocketProvider>
      ) : (
        <Stack screenOptions={{ headerShown: false }} />
      )}
      <Toaster
        theme={colorScheme === 'dark' ? 'dark' : 'light'}
        position="top-center"
        offset={50}
        toastOptions={{
          titleStyle: { fontFamily: 'Nunito' },
          descriptionStyle: { fontFamily: 'Nunito' }
        }}
      />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}