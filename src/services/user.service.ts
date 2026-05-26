import { Platform } from 'react-native';
import { api, getToken } from './api';
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
  const response = await api.get<UserProfile>('/api/users/profile');
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
  await api.patch('/api/users/update-password', { passwordactual, passwordnuevo });
};


export const deleteAccount = async (confirmationText: string): Promise<void> => {
  await api.delete('/api/users/delete-account', { data: { confirmationText } });
};

export const updatePushToken = async (token: string): Promise<void> => {
  const response = await api.patch('/api/users/update-push-token', { pushToken: token });
  return response.data;
};

export const updateUserPreferences = async (theme?: string, phoneWallpaperUri?: string, avatarUri?: string) => {
  try {
    let responseData: any = {};

    // CASO A: Actualizar el tema (patch simple)
    if (theme) {
      const response = await api.patch('/api/users/preferences', { theme });
      responseData = { ...responseData, ...response.data };
    }

    // CASO B: Subir Wallpaper
    if (phoneWallpaperUri) {
      if (phoneWallpaperUri.startsWith('bundled:')) {
        // Es un wallpaper por defecto, enviarlo como texto al endpoint de preferencias
        const response = await api.patch('/api/users/preferences', { phoneWallpaperUrl: phoneWallpaperUri });
        responseData = { ...responseData, ...response.data };
      } else {
        // Es una imagen local, subirla al nuevo endpoint update-image
        const formData = new FormData();
        formData.append('type', 'wallpaper');
        const filename = phoneWallpaperUri.split('/').pop() || 'wallpaper.jpg';
        formData.append('image', {
          uri: Platform.OS === 'ios' ? phoneWallpaperUri.replace('file://', '') : phoneWallpaperUri,
          name: filename,
          type: 'image/jpeg'
        } as any);

        const response = await api.patch('/api/users/preferences', formData);
        responseData = { ...responseData, ...response.data };
      }
    }

    // CASO C: Subir Avatar
    if (avatarUri) {
      const formData = new FormData();
      formData.append('type', 'avatar');
      const filename = avatarUri.split('/').pop() || 'avatar.jpg';
      formData.append('image', {
        uri: Platform.OS === 'ios' ? avatarUri.replace('file://', '') : avatarUri,
        name: filename,
        type: 'image/jpeg'
      } as any);

      const response = await api.patch('/api/users/preferences', formData);
      responseData = { ...responseData, ...response.data };
    }

    return responseData;
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
  const response = await api.get<SearchUsersResponse>('/api/users/search', { params: { q: query } });
  return response.data.users;
};