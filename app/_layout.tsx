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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // 🚀 Desactiva la alerta falsa de .value durante render/hot-reload
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutContent() {
  const { user } = useAuth();
  const { colorScheme, setColorScheme } = useColorScheme();

  const [fontsLoaded] = useFonts({
    'ElmsSans-Regular': require('../assets/fonts/ElmsSans-Regular.ttf'),
    'ElmsSans-Bold': require('../assets/fonts/ElmsSans-Bold.ttf'),
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'SNPro-Regular': require('../assets/fonts/SNPro-Regular.ttf'),
    'SNPro-Bold': require('../assets/fonts/SNPro-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (user?.preferences?.theme) {
      setColorScheme(user.preferences.theme as 'light' | 'dark' | 'system');
    }
  }, [user?.preferences?.theme]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {user ? (
        <SocketProvider userId={user._id}>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </SocketProvider>
      ) : (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
      )}
      <Toaster
        theme={colorScheme === 'dark' ? 'dark' : 'light'}
        position="top-center"
        offset={50}
        duration={1500} // 🚀 El estándar de 1.5 segundos
        toastOptions={{
          titleStyle: { fontFamily: 'Nunito-Bold' },
          descriptionStyle: { fontFamily: 'Nunito-Regular' }
        }}
      />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutContent />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}