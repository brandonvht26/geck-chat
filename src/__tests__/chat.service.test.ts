import { getChatMessages, sendMessage, deleteMessage, getPrivateChats } from '../services/chat.service';
import { api } from '../services/api';

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
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
});
