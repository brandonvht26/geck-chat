import { useState } from 'react';
import { useRouter } from 'expo-router';
import { loginUser, registerUser } from '../services/auth.service';
import { setToken, removeToken, ApiError } from '../services/api';
import { SocketService } from '../services/socket.service';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      await setToken(response.token);
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
    router.replace('/login');
  };

  return { signIn, signUp, signOut, loading };
};