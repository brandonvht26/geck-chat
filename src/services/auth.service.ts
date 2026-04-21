import { api, ApiError } from './api';
import { LoginPayload, RegisterPayload, ForgotPasswordPayload, ResetPasswordPayload, AuthResponse } from '../types/auth.types';

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/login', payload);
  return response.data;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/register', payload);
  return response.data;
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

export const resetPassword = async (token: string, password: string, confirmPassword: string): Promise<void> => {
  try {
    const payload: ResetPasswordPayload = { password, confirmPassword };
    await api.post(`/api/auth/reset-password/${token}`, payload);
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