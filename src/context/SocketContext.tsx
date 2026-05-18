import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAudioPlayer } from 'expo-audio';

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const player = useAudioPlayer(require('../../assets/sounds/pop.mp3'));

  useEffect(() => {
    if (!userId) return;

    const newSocket = io(SOCKET_URL);

    setSocket(newSocket);

    newSocket.emit('setup', userId);
    newSocket.emit('get_online_users');

    newSocket.on('online_users_list', (users: string[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('user_online', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    newSocket.on('user_offline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    const handleIncomingMessage = (newMessage: any) => {
      if (newMessage.senderId && newMessage.senderId !== userId) {
        player.play();
      }
    };

    newSocket.on('new_message', handleIncomingMessage);
    newSocket.on('message_received', handleIncomingMessage);

    return () => {
      newSocket.off('new_message', handleIncomingMessage);
      newSocket.off('message_received', handleIncomingMessage);
      newSocket.disconnect();
      setSocket(null);
      setOnlineUsers([]);
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
