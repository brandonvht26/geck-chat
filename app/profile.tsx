import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import ProfileAvatar from '@/src/components/profile/ProfileAvatar';
import ProfileInfoRow from '@/src/components/profile/ProfileInfoRow';
import Placeholder from '@/src/components/ui/Placeholder';
import { getUserProfile, UserProfile } from '@/src/services/user.service';

export default function ProfileScreen() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserProfile()
      .then(setProfileData)
      .catch((error) => {
        const apiError = error as { message?: string };
        Toast.show({
          type: 'error',
          text1: 'Algo salió mal',
          text2: apiError.message || 'No se pudo cargar el perfil',
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <View style={styles.content}>
          <ProfileAvatar />

          <View style={styles.infoContainer}>
            <ProfileInfoRow label="Nombre" value={profileData?.nombre || ''} />
            <ProfileInfoRow label="Correo" value={profileData?.email || ''} />
            <ProfileInfoRow label="Rol" value={profileData?.rol || 'Usuario'} />
          </View>

          <Placeholder title="Editar Perfil" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  infoContainer: {
    marginTop: 24,
  },
});