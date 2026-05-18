import { useEffect } from 'react';
import '../global.css';
import { Stack } from 'expo-router';
import { Toaster } from 'sonner-native'; // <-- Importación del nuevo sistema premium
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from '@/src/context/SocketContext';
import { useAuth } from '@/src/hooks/useAuth';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

// Evita que la pantalla de carga se oculte antes de tiempo mientras cargan las fuentes
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const RootLayout = () => {
  const { user } = useAuth();

  // Carga de fuentes personalizadas para Tailwind
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

  // Retorna null (pantalla en blanco/splash) hasta que las fuentes estén listas
  if (!loaded && !error) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* Reemplazamos View por GestureHandlerRootView */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {user ? (
          <SocketProvider userId={user._id}>
            <Stack screenOptions={{ headerShown: false }} />
          </SocketProvider>
        ) : (
          <Stack screenOptions={{ headerShown: false }} />
        )}
        <Toaster 
        position="top-center" 
        offset={50} 
        toastOptions={{
            titleStyle: {
              fontFamily: 'Nunito', // El nombre exacto que cargaste en useFonts
            },
            descriptionStyle: {
              fontFamily: 'Nunito',
            }
          }}
          />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
};

export default RootLayout;