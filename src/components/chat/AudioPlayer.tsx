import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

interface AudioPlayerProps {
    fileUrl: string;
    isSent: boolean;
    duration?: number;
}

export default function AudioPlayer({ fileUrl, isSent, duration = 0 }: AudioPlayerProps) {
    const player = useAudioPlayer(fileUrl);
    const status = useAudioPlayerStatus(player);

    const timeToDisplay = status.playing ? status.currentTime : (status.duration || duration);

    const formatTime = (timeInSeconds: number) => {
        const totalSeconds = Math.floor(timeInSeconds);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    useEffect(() => {
        if (status.duration && status.currentTime >= status.duration - 0.1) {
            player.pause();
            player.seekTo(0);
        }
    }, [status.currentTime, status.duration]);

    const handlePress = () => {
        if (status.playing) {
            player.pause();
        } else {
            if (status.duration && status.currentTime >= status.duration - 0.1) {
                player.seekTo(0);
            }
            player.play();
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePress}
            className={`flex-row items-center w-full px-4 py-2.5 rounded-2xl min-w-[130px] shadow-sm ${
                isSent 
                ? 'bg-white/20 border border-white/10' 
                : 'bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700'
            }`}
        >
            <Feather
                name={status.playing ? "pause" : "play"}
                size={18}
                color={isSent ? '#ffffff' : '#2A72D4'}
            />
            <View
                className={`flex-1 h-[3px] mx-3 rounded-full ${
                    isSent ? 'bg-white/50' : 'bg-primary/30 dark:bg-primary-dark/30'
                }`}
            />
            <Text className={`text-xs font-nunito-bold ${isSent ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {formatTime(timeToDisplay)}
            </Text>
        </TouchableOpacity>
    );
}