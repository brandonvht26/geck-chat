import React, { createContext, useContext, useState, useEffect } from 'react';
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
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    accent: string;
    wallpaperUrl?: string;
    phoneWallpaperUrl?: string;
  };
}

interface AuthContextType {
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loading: boolean;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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

      const loggedUser: User = {
        _id: response._id,
        name: response.name,
        email: response.email,
        rol: response.rol,
        avatarUrl: response.avatarUrl,
        preferences: (response as any).preferences, // <-- Parche de tipado
      };

      setUser(loggedUser);
      SocketService.connect(response._id);

      const initializePushNotifications = async () => {
        try {
          const expoPushToken = await registerForPushNotificationsAsync();
          if (expoPushToken) {
            await updatePushToken(expoPushToken);
            console.log('✅ Push Token sincronizado con el servidor');
          }
        } catch (error: any) {
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
        preferences: (response as any).preferences, // <-- Parche de tipado
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
      const response = await api.get<any>('/api/users/profile', {
        headers: { 'Cache-Control': 'no-cache' }
      });

      setUser({
        _id: response.data._id,
        name: response.data.nombre || response.data.name, // El backend a veces envía 'nombre'
        email: response.data.email,
        rol: response.data.rol,
        avatarUrl: response.data.avatarUrl,
        preferences: response.data.preferences,
      });
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

  return (
    <AuthContext.Provider value={{ signIn, signUp, signOut, loading, user, setUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
