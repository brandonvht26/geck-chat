import { getUserProfile, updateProfileData, updatePassword, searchUsers, updateUserPreferences } from '../services/user.service';
import { api, getToken } from '../services/api';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
  getToken: jest.fn().mockResolvedValue('fake-token'),
}));

jest.mock('expo-file-system/legacy', () => ({
  uploadAsync: jest.fn(),
  FileSystemUploadType: { MULTIPART: 1 },
}));

describe('User Service (Pruebas RESTful)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debería obtener el perfil de usuario exitosamente', async () => {
    const mockResponse = { data: { _id: '1', nombre: 'Juan Perez', email: 'juan@test.com' } };
    (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);

    const profile = await getUserProfile();

    expect(api.get).toHaveBeenCalledWith('/api/users/profile');
    // Verifica la normalización de nombre (nombre -> name)
    expect(profile.name).toBe('Juan Perez');
  });

  it('Debería actualizar los datos del perfil (nombre y email)', async () => {
    const mockResponse = { data: { success: true } };
    (api.patch as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await updateProfileData('1', { name: 'Juan Editado' });

    expect(api.patch).toHaveBeenCalledWith('/api/users/profile/1', { name: 'Juan Editado' });
    expect(result.success).toBe(true);
  });

  it('Debería actualizar la contraseña', async () => {
    (api.patch as jest.Mock).mockResolvedValueOnce({});
    
    await updatePassword('old123', 'new123');

    expect(api.patch).toHaveBeenCalledWith('/api/users/update-password', { passwordactual: 'old123', passwordnuevo: 'new123' });
  });

  it('Debería buscar usuarios por término de búsqueda', async () => {
    const mockResponse = { data: { users: [{ _id: '2', name: 'Maria' }] } };
    (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);

    const users = await searchUsers('Maria');

    expect(api.get).toHaveBeenCalledWith('/api/users/search', { params: { q: 'Maria' } });
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Maria');
  });

  it('Debería actualizar el tema (theme) del sistema exitosamente vía REST', async () => {
    const mockResponse = { data: { theme: 'dark' } };
    (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await updateUserPreferences('dark', undefined, undefined);

    expect(api.post).toHaveBeenCalledWith('/api/users/preferences', { theme: 'dark' });
    expect(result.theme).toBe('dark');
  });

  it('Debería subir el fondo de pantalla (wallpaper) de galería nativamente con uploadAsync', async () => {
    const mockUploadResponse = {
      status: 200,
      body: JSON.stringify({ phoneWallpaperUrl: 'https://cloudinary.com/wallpaper.jpg' })
    };
    (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce(mockUploadResponse);

    const result = await updateUserPreferences(undefined, 'file:///path/to/wallpaper.jpg', undefined);

    expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/preferences'),
      expect.stringContaining('wallpaper.jpg'),
      expect.objectContaining({
        httpMethod: 'POST',
        mimeType: 'image/jpeg',
        parameters: { type: 'wallpaper' },
        headers: { Authorization: 'Bearer fake-token' }
      })
    );
    expect(result.phoneWallpaperUrl).toBe('https://cloudinary.com/wallpaper.jpg');
  });
});
