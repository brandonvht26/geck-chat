import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'none', // Desactiva la transición nativa que causa el flashazo
                contentStyle: { backgroundColor: '#000' }, // Fondo negro absoluto
            }}
        />
    );
}