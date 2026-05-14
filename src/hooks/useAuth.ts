import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { loginUser, registerUser } from '../services/auth.service';
import { setToken, removeToken, getToken, ApiError } from '../services/api';
import { SocketService } from '../services/socket.service';
import { api } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  rol: string;
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      await setToken(response.token);
      setUser({
        _id: response._id,
        name: response.name,
        email: response.email,
        rol: response.rol,
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

  const checkAuth = async (): Promise<void> => {
    try {
      const token = await getToken();
      if (token) {
        const response = await api.get<{ _id: string; name: string; email: string; rol: string }>('/api/users/profile');
        setUser(response.data);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        await signOut();
      } else {
        console.log("🚨 ERROR EN AUTH CONTEXT:", error.response?.data || error.message);
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return { signIn, signUp, signOut, loading, user, checkAuth };
};