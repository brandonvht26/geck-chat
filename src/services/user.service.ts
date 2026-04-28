import { api } from './api';

export interface UserProfile {
  nombre: string;
  email: string;
  rol?: string;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>('api/users/profile');
  return response.data;
};