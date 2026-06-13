import { loginUser, registerUser } from '../services/auth.service';
import { api } from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('Auth Service (Pruebas de Aceptación RESTful)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debería iniciar sesión correctamente (Simulando 200 OK)', async () => {
    // Simulamos la respuesta feliz del backend respetando la interfaz AuthResponse
    const mockResponse = {
      data: {
        token: 'fake-jwt-token',
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
        rol: 'user',
      },
    };
    
    (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const payload = { email: 'test@example.com', password: 'password123' };
    const result = await loginUser(payload);

    // Verificaciones
    expect(api.post).toHaveBeenCalledWith('/api/auth/login', { ...payload, platform: 'mobile' });
    expect(result.token).toBe('fake-jwt-token');
    expect(result.name).toBe('Test User'); 
  });

  it('Debería fallar el login si las credenciales son incorrectas (Simulando 401 Unauthorized)', async () => {
    // Simulamos un error 401 del backend
    const mockError = new Error('Request failed with status code 401');
    (mockError as any).response = {
      status: 401,
      data: { message: 'Credenciales inválidas' }
    };

    (api.post as jest.Mock).mockRejectedValueOnce(mockError);

    const payload = { email: 'wrong@example.com', password: 'wrong' };
    
    // Verificamos que el error se propague correctamente
    await expect(loginUser(payload)).rejects.toThrow('Request failed with status code 401');
  });

  it('Debería registrarse correctamente (Simulando 200 OK)', async () => {
    const mockResponse = {
      data: {
        token: 'fake-jwt-token-2',
        _id: '2',
        name: 'New User',
        email: 'new@example.com',
        rol: 'user',
      },
    };
    (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const payload = { email: 'new@example.com', password: 'password123', name: 'New User' };
    const result = await registerUser(payload);

    expect(api.post).toHaveBeenCalledWith('/api/auth/register', { ...payload, platform: 'mobile' });
    expect(result.token).toBe('fake-jwt-token-2');
  });
});
