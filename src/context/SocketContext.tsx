import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URI || 'http://localhost:3000';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({ socket: null, onlineUsers: [] });

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
  userId: string;
}

export const SocketProvider = ({ children, userId }: SocketProviderProps) => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit('setup', userId);
    socket.emit('get_online_users');

    socket.on('online_users_list', (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on('user_online', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    socket.on('user_offline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setOnlineUsers([]);
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
