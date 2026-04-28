import { api } from './api';

export interface UserProfile {
  _id: string;
  nombre: string;
  email: string;
  rol?: string;
  preferences?: {
    wallpaperUrl?: string;
  };
}

export interface SearchedUser {
  _id: string;
  name: string;
  email: string;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>('api/users/profile');
  return response.data;
};

export const updateProfile = async (id: string, nombre: string, email: string): Promise<void> => {
  await api.put(`api/users/profile/${id}`, { nombre, email });
};

export const updatePassword = async (passwordactual: string, passwordnuevo: string): Promise<void> => {
  await api.put('api/users/update-password', { passwordactual, passwordnuevo });
};

export const updateProfileImage = async (imageUri: string): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    name: 'profile.jpg',
    type: 'image/jpeg',
  } as any);

  const response = await api.post<{ imageUrl: string }>('api/users/update-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteAccount = async (confirmationText: string): Promise<void> => {
  await api.delete('api/users/delete-account', { data: { confirmationText } });
};

interface SearchUsersResponse {
  ok: boolean;
  users: SearchedUser[];
}

export const searchUsers = async (query: string): Promise<SearchedUser[]> => {
  const response = await api.get<SearchUsersResponse>('api/users/search', { params: { q: query } });
  return response.data.users;
};