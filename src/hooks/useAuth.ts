import { useState } from 'react';
import { loginUser, registerUser } from '../services/auth.service';
import { setToken, ApiError } from '../services/api';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      await setToken(response.token);
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
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return { signIn, signUp, loading };
};