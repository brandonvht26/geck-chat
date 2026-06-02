import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URI || 'http://localhost:3000').replace(/\/api$/, '');

let socket: Socket | null = null;
let activeUserId: string | null = null;

export const SocketService = {
  connect(userId: string): void {
    activeUserId = userId;

    if (socket) {
      if (!socket.connected) {
        socket.connect();
      }
      return;
    }

    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      if (activeUserId) {
        socket?.emit('setup', activeUserId);
      }
    });
  },

  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  emit(eventName: string, data?: any): void {
    if (socket) {
      socket.emit(eventName, data);
    }
  },

  on(eventName: string, callback: (data: any) => void): void {
    if (socket) {
      socket.on(eventName, callback);
    }
  },

  off(eventName: string, callback?: (data: any) => void): void {
    if (socket) {
      socket.off(eventName, callback);
    }
  },
};
