import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import UserSearch from '@/src/components/shared/UserSearch';

export default function InviteMemberScreen() {
  const params = useLocalSearchParams<any>();
  const router = useRouter();
  const workspaceId = params.workspaceId;

  const handleInviteUser = async (selectedUser: any) => {
    try {
      // await inviteMember(workspaceId, selectedUser.email);
      Alert.alert('Éxito', `Invitación enviada a ${selectedUser.name}`);
      // router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la invitación');
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary dark:text-primary-dark text-base">Cancelar</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-textMain dark:text-textMain-dark">Invitar Miembro</Text>
        <View className="w-16" />
      </View>

      <UserSearch
        onUserSelect={handleInviteUser}
        actionLabel="Invitar"
        actionIcon="user-plus"
      />
    </View>
  );
}