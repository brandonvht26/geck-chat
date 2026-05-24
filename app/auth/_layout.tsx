import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
    return (
        <>
            {/* 🚀 Fuerza los iconos del sistema (batería, hora) a color blanco */}
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'none',
                    contentStyle: { backgroundColor: '#FFFFFF' }, 
                }}
            />
        </>
    );
}