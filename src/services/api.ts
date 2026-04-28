import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@geckchat_token';

export interface ApiError {
  message: string;
  status?: number;
}

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  401: 'Credenciales incorrectas. Verifica tu correo y contraseña.',
  404: 'El recurso solicitado no existe o el usuario no está registrado.',
  500: 'Estamos experimentando problemas técnicos. Intenta más tarde.',
};

const DEFAULT_ERROR_MESSAGE = 'Error de conexión con el servidor';

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

const getErrorMessage = (error: AxiosError): string => {
  const status = error.response?.status;
  const backendMessage = (error.response?.data as { msg?: string })?.msg;

  if (backendMessage) {
    return backendMessage;
  }

  if (status && HTTP_ERROR_MESSAGES[status]) {
    return HTTP_ERROR_MESSAGES[status];
  }

  return DEFAULT_ERROR_MESSAGE;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }

    const status = error.response?.status;
    const message = error.code === 'ECONNABORTED'
      ? 'La solicitud tardó demasiado. Verifica tu conexión.'
      : error.code === 'ERR_NETWORK'
      ? 'No hay conexión a internet. Revisa tu red.'
      : getErrorMessage(error);

    const apiError: ApiError = {
      message,
      status,
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