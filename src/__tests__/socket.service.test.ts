import { SocketService } from '../services/socket.service';
import { io } from 'socket.io-client';

// Mock socket.io-client global
jest.mock('socket.io-client', () => {
  const mSocket = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connected: false,
  };
  return { io: jest.fn(() => mSocket) };
});

describe('Socket Service (Pruebas de Aceptación WebSockets)', () => {
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Nos aseguramos de limpiar la instancia singleton entre tests
    SocketService.disconnect();
    // Obtenemos la referencia al mock que io() retornaría
    mockSocket = io('mock-url');
  });

  it('Debería conectar e inicializar el setup con el userId correcto al autenticarse', () => {
    SocketService.connect('user-123');

    expect(io).toHaveBeenCalled();
    const socketInstance = SocketService.getSocket();
    expect(socketInstance).toBeDefined();

    // Buscamos el handler que el SocketService registró para el evento 'connect'
    const connectHandlerCall = mockSocket.on.mock.calls.find((call: any) => call[0] === 'connect');
    expect(connectHandlerCall).toBeDefined();
    
    // Simulamos que el servidor aceptó la conexión WebSocket
    const connectHandler = connectHandlerCall[1];
    connectHandler();

    // Verificamos que el cliente haya emitido su userId para unirse a su sala personal
    expect(mockSocket.emit).toHaveBeenCalledWith('setup', 'user-123');
  });

  it('Debería emitir y enrutar eventos de chat correctamente al canal de la sala', () => {
    SocketService.connect('user-456');

    // Comprobamos la emisión de un cliente local hacia el backend
    SocketService.emit('join_chat', 'chat-789');
    expect(mockSocket.emit).toHaveBeenCalledWith('join_chat', 'chat-789');

    // Comprobamos la suscripción del cliente a un evento entrante del backend
    const callback = jest.fn();
    SocketService.on('new_message', callback);
    expect(mockSocket.on).toHaveBeenCalledWith('new_message', callback);
  });
  
  it('Debería desconectar el socket al cerrar sesión', () => {
    SocketService.connect('user-789');
    expect(SocketService.getSocket()).not.toBeNull();
    
    SocketService.disconnect();
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(SocketService.getSocket()).toBeNull();
  });
});
