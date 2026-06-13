import { getUserProfile, updateProfileData, updatePassword, searchUsers } from '../services/user.service';
import { api } from '../services/api';

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
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
});
