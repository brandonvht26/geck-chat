import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { toast } from 'sonner-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import UserSearch from '@/src/components/shared/UserSearch';
import { inviteMember } from '@/src/services/workspace.service';
import { StatusBar } from 'expo-status-bar';

export default function InviteMemberScreen() {
  const params = useLocalSearchParams<any>();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  
  const workspaceId = params.workspaceId;
  
  // 🚀 Extraemos los IDs de los miembros actuales (incluyendo al usuario actual)
  const existingUserIds = useMemo(() => {
    try {
      return params.existingMembersRaw ? JSON.parse(params.existingMembersRaw) : [];
    } catch {
      return [];
    }
  }, [params.existingMembersRaw]);

  const handleInviteUser = async (selectedUser: any) => {
    try {
      await inviteMember(workspaceId, selectedUser.email);
      toast.success('Invitación enviada', { description: `Se ha añadido a ${selectedUser.name}` });
      router.back();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'No se pudo enviar la invitación');
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      <StatusBar style="light" />
      {/* 🚀 Transformamos la pantalla en un Modal */}
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Añadir Miembros',
          headerTitleStyle: { fontFamily: 'SNPro-Bold', fontSize: 18 },
          headerStyle: { backgroundColor: colorScheme === 'dark' ? '#8261D4' : '#2A72D4' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />

      <UserSearch
        onUserSelect={handleInviteUser}
        actionLabel="Invitar"
        actionIcon="user-plus"
        excludeUserIds={existingUserIds} 
      />
    </View>
  );
}