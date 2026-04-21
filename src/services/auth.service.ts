import { api } from './api';
import { LoginPayload, RegisterPayload, AuthResponse } from '../types/auth.types';

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/login', payload);
  return response.data;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/register', payload);
  return response.data;
};