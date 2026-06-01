import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAudioPlayer } from 'expo-audio';

import { SocketService } from '../services/socket.service';

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

    // Conectamos el servicio global (si no estaba ya conectado)
    SocketService.connect(userId);
    const globalSocket = SocketService.getSocket();
    setSocket(globalSocket);

    SocketService.emit('get_online_users');

    // Registramos listeners en el servicio
    SocketService.on('online_users_list', (users: string[]) => {
      setOnlineUsers(users);
    });

    SocketService.on('user_online', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => (prev.includes(userId) ? prev : [...prev, userId]));
    });

    SocketService.on('user_offline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    const handleIncomingMessage = (newMessage: any) => {
      if (newMessage.senderId && newMessage.senderId !== userId) {
        player.play();
      }
    };

    SocketService.on('new_message', handleIncomingMessage);
    SocketService.on('message_received', handleIncomingMessage);
    SocketService.on('receive_message', handleIncomingMessage);

    return () => {
      SocketService.off('online_users_list');
      SocketService.off('user_online');
      SocketService.off('user_offline');
      SocketService.off('new_message', handleIncomingMessage);
      SocketService.off('message_received', handleIncomingMessage);
      SocketService.off('receive_message', handleIncomingMessage);
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
