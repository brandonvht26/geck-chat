import { api, ApiError } from './api';
import { LoginPayload, RegisterPayload, ForgotPasswordPayload, AuthResponse } from '../types/auth.types';

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  // 🚀 Inyectamos la plataforma móvil dinámicamente para exigir el token de 1 año
  const dataToSend = { ...payload, platform: 'mobile' };
  const response = await api.post<any>('/api/auth/login', dataToSend);
  if (response.data?.user?.nombre && !response.data?.user?.name) {
    response.data.user.name = response.data.user.nombre;
  }
  return response.data as AuthResponse;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  // 🚀 Inyectamos la plataforma aquí también, garantizando que el auto-login del registro dure 1 año
  const dataToSend = { ...payload, platform: 'mobile' };
  const response = await api.post<any>('/api/auth/register', dataToSend);
  if (response.data?.user?.nombre && !response.data?.user?.name) {
    response.data.user.name = response.data.user.nombre;
  }
  return response.data as AuthResponse;
};

export const recoverPassword = async (email: string): Promise<void> => {
  try {
    const payload: ForgotPasswordPayload = { email };
    await api.post('/api/auth/forgot-password', payload);
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError.message);
  }
};

export const confirmEmail = async (token: string): Promise<void> => {
  try {
    await api.get(`/api/auth/confirm/${token}`);
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError.message);
  }
};