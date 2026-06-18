import { getDesktopItems, uploadDocument, deleteDocument, searchItems } from '../services/item.service';
import { api } from '../services/api';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    delete: jest.fn(),
  },
  getToken: jest.fn().mockResolvedValue('fake-token'),
}));

jest.mock('expo-file-system/legacy', () => ({
  uploadAsync: jest.fn(),
  FileSystemUploadType: { MULTIPART: 1 },
}));

describe('Item Service (Pruebas RESTful)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debería obtener los elementos (documentos) del escritorio', async () => {
    const mockResponse = { data: { ok: true, items: [{ _id: 'doc1', name: 'Tesis.pdf', url: 'http://test' }] } };
    (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);

    const items = await getDesktopItems();

    expect(api.get).toHaveBeenCalledWith('/api/items/desktop', {
      params: { folderId: 'null', workspaceId: 'null' },
    });
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Tesis.pdf');
  });

  it('Debería subir un documento nativamente con uploadAsync', async () => {
    const mockUploadResponse = {
      status: 200,
      body: JSON.stringify({ item: { _id: 'doc2', name: 'Reporte.pdf', url: 'https://cloudinary.com/doc2.pdf' } })
    };
    (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce(mockUploadResponse);

    const result = await uploadDocument('file:///path/to/Reporte.pdf', 'Reporte.pdf', 'application/pdf');

    expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
      expect.stringContaining('/api/items/upload'),
      expect.stringContaining('path/to/Reporte.pdf'),
      expect.objectContaining({
        httpMethod: 'POST',
        mimeType: 'application/pdf',
        parameters: expect.objectContaining({ parentId: 'null', workspaceId: 'null' }),
        headers: { Authorization: 'Bearer fake-token' }
      })
    );
    expect(result.url).toBe('https://cloudinary.com/doc2.pdf');
  });

  it('Debería eliminar un documento exitosamente', async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({});

    await deleteDocument('doc1');

    expect(api.delete).toHaveBeenCalledWith('/api/items/delete/doc1');
  });
});
