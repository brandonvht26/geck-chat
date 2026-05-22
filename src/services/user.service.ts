import { api } from './api';

export interface UserProfile {
  _id: string;
  nombre: string;
  email: string;
  rol?: string;
  avatarUrl?: string;
  preferences?: {
    phoneWallpaperUrl?: string;
    desktopWallpaperUrl?: string;
  };
}

export interface SearchedUser {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  profilePicture?: string;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>('api/users/profile');
  return response.data;
};

export const updateProfileData = async (userId: string, data: { name?: string; email?: string }): Promise<any> => {
  try {
    const response = await api.patch(`/api/users/profile/${userId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    throw error;
  }
};

export const updatePassword = async (passwordactual: string, passwordnuevo: string): Promise<void> => {
  await api.put('api/users/update-password', { passwordactual, passwordnuevo });
};


export const deleteAccount = async (confirmationText: string): Promise<void> => {
  await api.delete('api/users/delete-account', { data: { confirmationText } });
};

export const updatePushToken = async (token: string): Promise<void> => {
  const response = await api.patch('/api/users/update-push-token', { pushToken: token });
  return response.data;
};

export const updateUserPreferences = async (theme?: string, phoneWallpaperUri?: string, avatarUri?: string) => {
  try {
    const formData = new FormData();

    if (theme) formData.append('theme', theme);

    if (phoneWallpaperUri) {
      const filename = phoneWallpaperUri.split('/').pop() || 'wallpaper.jpg';
      formData.append('phoneWallpaper', {
        uri: phoneWallpaperUri,
        name: filename,
        type: 'image/jpeg'
      } as any);
    }

    if (avatarUri) {
      const filename = avatarUri.split('/').pop() || 'avatar.jpg';
      formData.append('avatar', {
        uri: avatarUri,
        name: filename,
        type: 'image/jpeg'
      } as any);
    }

    const response = await api.patch('/api/users/preferences', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error actualizando preferencias:', error);
    throw error;
  }
};

interface SearchUsersResponse {
  ok: boolean;
  users: SearchedUser[];
}

export const searchUsers = async (query: string): Promise<SearchedUser[]> => {
  const response = await api.get<SearchUsersResponse>('api/users/search', { params: { q: query } });
  return response.data.users;
};