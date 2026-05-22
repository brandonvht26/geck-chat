import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { loginUser, registerUser } from '../services/auth.service';
import { setToken, removeToken, getToken, ApiError } from '../services/api';
import { SocketService } from '../services/socket.service';
import { api } from '../services/api';
import { registerForPushNotificationsAsync } from '@/src/services/notification.service';
import { updatePushToken } from '@/src/services/user.service';

interface User {
  _id: string;
  name: string;
  email: string;
  rol: string;
  avatarUrl?: string;
}

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      await removeToken();
      const response = await loginUser({ email, password });
      console.log("🔑 TOKEN RECIBIDO:", response.token);
      await setToken(response.token);
      setUser({
        _id: response._id,
        name: response.name,
        email: response.email,
        rol: response.rol,
        avatarUrl: response.avatarUrl,
      });
      SocketService.connect(response._id);

      // Sincronizar Push Token con el servidor en segundo plano
      const initializePushNotifications = async () => {
        try {
          const expoPushToken = await registerForPushNotificationsAsync();
          if (expoPushToken) {
            await updatePushToken(expoPushToken);
            console.log('✅ Push Token sincronizado con el servidor');
          }
        } catch (error: any) {
          // Silenciamos el error si es por el entorno de desarrollo de Expo Go
          if (error.message?.includes('Expo Go') || error.message?.includes('development build')) {
            console.log('ℹ️ Modo Expo Go detectado. Las notificaciones Push están desactivadas.');
          } else {
            console.log('⚠️ No se pudo registrar el Push Token:', error.message);
          }
        }
      };
      initializePushNotifications();
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await registerUser({ name, email, password });
      await setToken(response.token);
      setUser({
        _id: response._id,
        name: response.name,
        email: response.email,
        rol: response.rol,
        avatarUrl: response.avatarUrl,
      });
      SocketService.connect(response._id);
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    SocketService.disconnect();
    await removeToken();
    setUser(null);
    router.replace('/auth/login');
  };

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await api.get<{ _id: string; name: string; email: string; rol: string; avatarUrl?: string }>('/api/users/profile');
      setUser(response.data);
    } catch (error) {
      console.log('🚨 ERROR EN AUTH CONTEXT: Token inválido o red caída');
      await removeToken();
      setUser(null);
      router.replace('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return { signIn, signUp, signOut, loading, user, setUser, checkAuth };
};
