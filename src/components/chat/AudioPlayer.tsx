import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';

interface AudioPlayerProps {
    fileUrl: string;
    isSent: boolean;
}

export default function AudioPlayer({ fileUrl, isSent }: AudioPlayerProps) {
    // 🚀 Hook moderno de Expo Audio: Maneja la memoria y el estado por ti
    const player = useAudioPlayer(fileUrl);

    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handlePress = () => {
        if (player.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePress}
            className={`flex-row items-center px-3 py-2 rounded-2xl min-w-[120px] shadow-sm ${isSent ? 'bg-white/20 border border-white/10' : 'bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700'
                }`}
        >
            <Feather
                name={player.playing ? "pause" : "play"}
                size={20}
                color={isSent ? '#ffffff' : '#2A72D4'}
            />
            <View
                className={`flex-1 h-[2px] mx-2 rounded-full ${isSent ? 'bg-white/50' : 'bg-primary/30 dark:bg-primary-dark/30'
                    }`}
            />
            <Text className={`text-xs font-nunito-bold ${isSent ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {player.duration ? formatTime(player.duration) : "0:00"}
            </Text>
        </TouchableOpacity>
    );
}