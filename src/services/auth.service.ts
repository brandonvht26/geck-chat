import { api, ApiError } from './api';
import { LoginPayload, RegisterPayload, ForgotPasswordPayload, AuthResponse } from '../types/auth.types';

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/login', payload);
  return response.data;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/register', payload);
  return response.data;
};

export const loginGoogleMobile = async (idToken: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/google', { idToken });
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    throw new Error(apiError.message);
  }
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