import { getWorkspaces, createWorkspace, inviteMember } from '../services/workspace.service';
import { api } from '../services/api';

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Workspace Service (Pruebas RESTful)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debería obtener la lista de workspaces del usuario si el server retorna OK', async () => {
    const mockResponse = { data: { ok: true, workspaces: [{ id: 'w1', name: 'Dev Team' }] } };
    (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);

    const workspaces = await getWorkspaces();

    expect(api.get).toHaveBeenCalledWith('/api/workspaces/fetch-user-workspaces');
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0].name).toBe('Dev Team');
  });

  it('Debería arrojar un error si la respuesta OK es falsa', async () => {
    const mockResponse = { data: { ok: false } };
    (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);

    await expect(getWorkspaces()).rejects.toThrow('Error del servidor al obtener workspaces');
  });

  it('Debería crear un nuevo workspace exitosamente', async () => {
    const mockResponse = { data: { id: 'w2', name: 'Design' } };
    (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await createWorkspace('Design', 'Design team');

    expect(api.post).toHaveBeenCalledWith('/api/workspaces/create', { name: 'Design', description: 'Design team' });
    expect(result.id).toBe('w2');
  });

  it('Debería invitar a un miembro a un workspace vía correo electrónico', async () => {
    const mockResponse = { data: { ok: true, msg: 'Invitación enviada' } };
    (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await inviteMember('w1', 'dev@test.com');

    expect(api.post).toHaveBeenCalledWith('/api/workspaces/invite', { workspaceId: 'w1', email: 'dev@test.com' });
    expect(result.ok).toBe(true);
  });
});
