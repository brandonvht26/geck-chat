import { getChatMessages, sendMessage, deleteMessage, getPrivateChats, sendFileMessage } from '../services/chat.service';
import { api, getToken } from '../services/api';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
  getToken: jest.fn().mockResolvedValue('fake-token'),
}));

jest.mock('expo-file-system/legacy', () => ({
  uploadAsync: jest.fn(),
  FileSystemUploadType: { MULTIPART: 1 },
}));

describe('Chat Service (Pruebas RESTful)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debería obtener los chats privados del usuario (filtra grupos)', async () => {
    const mockResponse = {
      data: {
        chats: [
          { _id: 'chat1', isGroup: false },
          { _id: 'chat2', isGroup: true }
        ]
      }
    };
    (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);

    const chats = await getPrivateChats();

    expect(api.get).toHaveBeenCalledWith('/api/chat/chat');
    expect(chats).toHaveLength(1); // Debe omitir el grupo
    expect(chats[0]._id).toBe('chat1');
  });

  it('Debería cargar los mensajes de un chat con el límite estricto de 500 mensajes', async () => {
    const mockResponse = { data: { messages: [{ _id: 'm1', content: 'Hola' }] } };
    (api.get as jest.Mock).mockResolvedValueOnce(mockResponse);

    const messages = await getChatMessages('chat123');

    expect(api.get).toHaveBeenCalledWith('/api/chat/chat123/chat', { params: { limit: 500 } });
    expect(messages[0].content).toBe('Hola');
  });

  it('Debería enviar un mensaje de texto exitosamente enviando el Timestamp del cliente', async () => {
    const mockResponse = { data: { message: { _id: 'm2', content: 'Nuevo' } } };
    (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const message = await sendMessage('chat123', 'Nuevo');

    expect(api.post).toHaveBeenCalledWith('/api/chat/message', expect.objectContaining({
      chatId: 'chat123',
      content: 'Nuevo'
    }));
    // Verifica que se inyecta la hora del cliente
    const callArgs = (api.post as jest.Mock).mock.calls[0][1];
    expect(callArgs.clientTimestamp).toBeDefined();
    
    expect(message.content).toBe('Nuevo');
  });

  it('Debería procesar la eliminación "for_all" de un mensaje', async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({});

    await deleteMessage('m1', 'for_all');

    expect(api.delete).toHaveBeenCalledWith('/api/chat/message/m1', { data: { type: 'for_all' } });
  });

  it('Debería enviar un archivo multimedia exitosamente a través de uploadAsync', async () => {
    // Simulamos la respuesta del backend para un archivo
    const mockUploadResponse = {
      status: 200,
      body: JSON.stringify({ message: { _id: 'm3', fileUrl: 'https://cloudinary.com/file.pdf', type: 'file' } })
    };
    
    (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce(mockUploadResponse);

    const result = await sendFileMessage('chat123', 'file:///path/to/file.pdf', 'document.pdf', 'application/pdf');

    expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
      expect.stringContaining('/api/chat/file'),
      expect.stringContaining('path/to/file.pdf'), // Verifica que le quita el 'file://' en iOS o lo mantiene, dependiendo de Platform
      expect.objectContaining({
        httpMethod: 'POST',
        mimeType: 'application/pdf',
        parameters: { chatId: 'chat123' },
        headers: { Authorization: 'Bearer fake-token' }
      })
    );
    expect(result.fileUrl).toBe('https://cloudinary.com/file.pdf');
  });
});
