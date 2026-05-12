import { useQuery } from '@tanstack/react-query';
import { getUserChats, Chat } from '@/src/services/chat.service';

export const useUserChats = () => {
    return useQuery<Chat[]>({
        queryKey: ['userChats'],
        queryFn: async () => {
            const response = await getUserChats();
            return response?.sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            ) || [];
        },
    });
};