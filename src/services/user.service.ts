import { api, getToken } from './api';
import * as FileSystem from 'expo-file-system/legacy';
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

  // Helper para parsear la respuesta sin crashear con HTML de error
  const safeJson = async (res: Response) => {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error(`Error del servidor (${res.status}): respuesta inesperada`);
    }
    return res.json();
  };

  try {
    let responseData: any = {};

    // CASO A: Actualizar el tema (patch simple con JSON)
    if (theme) {
      const response = await api.put('/api/users/preferences', { theme });
      responseData = { ...responseData, ...response.data };
    }

    // CASO B: Subir Wallpaper
    if (phoneWallpaperUri) {
      if (phoneWallpaperUri.startsWith('bundled:')) {
        // Bundled wallpaper → solo enviamos la URL como texto plano (PATCH JSON)
        const response = await api.put('/api/users/preferences', { phoneWallpaperUrl: phoneWallpaperUri });
        responseData = { ...responseData, ...response.data };
      } else {
        // Wallpaper desde galería → FileSystem.uploadAsync
        const uploadUrl = `${BASE_URL}/api/users/preferences`;
        const res = await FileSystem.uploadAsync(uploadUrl, phoneWallpaperUri, {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'image',
          mimeType: 'image/jpeg',
          parameters: { type: 'phoneWallpaper' },
          headers: authHeaders
        });
        
        let data;
        try { data = JSON.parse(res.body); } catch(e) { data = { msg: 'Error de parseo' }; }
        if (res.status !== 200 && res.status !== 201) throw new Error(data.msg || 'Error al subir wallpaper');
        responseData = { ...responseData, ...data };
      }
    }

    // CASO C: Subir Avatar
    if (avatarUri) {
      const uploadUrl = `${BASE_URL}/api/users/preferences`;
      console.log('[updateUserPreferences] Subiendo avatar a:', uploadUrl);

      const res = await FileSystem.uploadAsync(uploadUrl, avatarUri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'image',
        mimeType: 'image/jpeg',
        parameters: { type: 'avatar' },
        headers: authHeaders
      });

      let data;
      try { data = JSON.parse(res.body); } catch(e) { data = { msg: 'Error de parseo' }; }
      console.log('[updateUserPreferences] Respuesta avatar:', res.status, data);
      if (res.status !== 200 && res.status !== 201) throw new Error(data.msg || 'Error al subir avatar');
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