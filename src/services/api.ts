import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@geckchat_token';

export interface ApiError {
  message: string;
  status?: number;
}

export const api: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URI || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    const apiError: ApiError = {
      message: (error.response?.data as { message?: string })?.message || error.message || 'Error de conexión',
      status: error.response?.status,
    };
    return Promise.reject(apiError);
  }
);

export const setToken = (token: string): Promise<void> => {
  return AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): Promise<string | null> => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): Promise<void> => {
  return AsyncStorage.removeItem(TOKEN_KEY);
};