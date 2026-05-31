import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { loginUser, registerUser } from '../services/auth.service';
import { setToken, removeToken, getToken, setCachedUser, getCachedUser, removeCachedUser, ApiError, api } from '../services/api';
import { SocketService } from '../services/socket.service';

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
      await setToken(response.token);

      const loggedUser: User = {
        _id: response._id,
        name: response.name,
        email: response.email,
        rol: response.rol,
        avatarUrl: response.avatarUrl,
        preferences: (response as any).preferences, 
      };

      setUser(loggedUser);
      await setCachedUser(loggedUser);
      SocketService.connect(response._id);

      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await registerUser({ name, email, password });
      await setToken(response.token);
      const loggedUser = {
        _id: response._id,
        name: response.name,
        email: response.email,
        rol: response.rol,
        avatarUrl: response.avatarUrl,
        preferences: (response as any).preferences, 
      };
      setUser(loggedUser);
      await setCachedUser(loggedUser);
      SocketService.connect(response._id);
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    SocketService.disconnect();
    await removeToken();
    await removeCachedUser();
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
      
      // 🚀 OFFLINE-FIRST: Cargar desde el caché instantáneamente
      const cachedUser = await getCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
        SocketService.connect(cachedUser._id);
        setLoading(false); // Liberar la UI de inmediato
      }

      // Revalidación silenciosa en segundo plano
      const response = await api.get<any>('/api/users/profile', {
        headers: { 'Cache-Control': 'no-cache' }
      });

      const updatedUser = {
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        rol: response.data.rol,
        avatarUrl: response.data.avatarUrl,
        preferences: response.data.preferences,
      };

      setUser(updatedUser);
      await setCachedUser(updatedUser);
      
    } catch (error) {
      // Si el error es 401, el interceptor en api.ts ya habrá borrado el token y redirigido.
      // Si es un error de red, simplemente fallamos silenciosamente y el usuario sigue usando el caché.
      console.error("Error validando sesión (probablemente sin internet):", error);
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
