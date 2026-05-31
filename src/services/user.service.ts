import { api, getToken } from './api';
export interface UserProfile {
  _id: string;
  name: string;
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
  const response = await api.get<any>('/api/users/profile');
  if (response.data && response.data.nombre && !response.data.name) {
    response.data.name = response.data.nombre;
  }
  return response.data as UserProfile;
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
  const BASE_URL = process.env.EXPO_PUBLIC_API_URI || 'http://localhost:3000';
  const token = await getToken();
  const authHeaders = { Authorization: `Bearer ${token}` };

  try {
    let responseData: any = {};

    // CASO A: Actualizar el tema (patch simple con JSON)
    if (theme) {
      const response = await api.patch('/api/users/preferences', { theme });
      responseData = { ...responseData, ...response.data };
    }

    // CASO B: Subir Wallpaper
    if (phoneWallpaperUri) {
      if (phoneWallpaperUri.startsWith('bundled:')) {
        // Bundled wallpaper → solo enviamos la URL como texto plano (PATCH JSON)
        const response = await api.patch('/api/users/preferences', { phoneWallpaperUrl: phoneWallpaperUri });
        responseData = { ...responseData, ...response.data };
      } else {
        // Wallpaper desde galería → usamos fetch nativo (maneja FormData correctamente en RN)
        const formData = new FormData();
        formData.append('type', 'wallpaper');
        const filename = phoneWallpaperUri.split('/').pop() || 'wallpaper.jpg';
        formData.append('image', { uri: phoneWallpaperUri, name: filename, type: 'image/jpeg' } as any);

        const res = await fetch(`${BASE_URL}/api/users/preferences`, {
          method: 'PATCH',
          headers: authHeaders,
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Error al subir wallpaper');
        responseData = { ...responseData, ...data };
      }
    }

    // CASO C: Subir Avatar → fetch nativo por la misma razón
    if (avatarUri) {
      const formData = new FormData();
      formData.append('type', 'avatar');
      const filename = avatarUri.split('/').pop() || 'avatar.jpg';
      formData.append('image', { uri: avatarUri, name: filename, type: 'image/jpeg' } as any);

      const uploadUrl = `${BASE_URL}/api/users/preferences`;
      console.log('[updateUserPreferences] Subiendo avatar a:', uploadUrl);

      const res = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: authHeaders,
        body: formData,
      });
      const data = await res.json();
      console.log('[updateUserPreferences] Respuesta avatar:', res.status, data);
      if (!res.ok) throw new Error(data.msg || 'Error al subir avatar');
      responseData = { ...responseData, ...data };
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