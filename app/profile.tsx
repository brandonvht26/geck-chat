import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ProfileAvatar from '@/src/components/profile/ProfileAvatar';
import ProfileInfoRow from '@/src/components/profile/ProfileInfoRow';
import { getUserProfile, updateProfileImage, UserProfile } from '@/src/services/user.service';
import { ApiError } from '@/src/services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    getUserProfile()
      .then(setProfileData)
      .catch((error) => {
        const apiError = error as ApiError;
        Toast.show({
          type: 'error',
          text1: 'Algo salió mal',
          text2: apiError.message || 'No se pudo cargar el perfil',
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleEditProfile = () => {
    if (profileData) {
      router.push({
        pathname: '/edit-profile',
        params: {
          id: profileData._id,
          nombre: profileData.nombre,
          email: profileData.email,
        },
      });
    }
  };

  const handleUpdateImage = async () => {
    Alert.alert('Actualizar Foto', 'Elige una opción', [
      {
        text: 'Tomar Foto',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Toast.show({ type: 'error', text1: 'Permiso requerido', text2: 'Se necesita acceso a la cámara' });
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            setIsUploading(true);
            try {
              const response = await updateProfileImage(result.assets[0].uri);
              setProfileData(prev => prev ? { ...prev, preferences: { ...prev.preferences, wallpaperUrl: response.imageUrl } } : null);
              Toast.show({ type: 'success', text1: '¡Logrado!', text2: 'Foto actualizada correctamente' });
            } catch (error) {
              const apiError = error as ApiError;
              Toast.show({ type: 'error', text1: 'Algo salió mal', text2: apiError.message || 'No se pudo actualizar la foto' });
            } finally {
              setIsUploading(false);
            }
          }
        },
      },
      {
        text: 'Elegir de Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Toast.show({ type: 'error', text1: 'Permiso requerido', text2: 'Se necesita acceso a la galería' });
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            setIsUploading(true);
            try {
              const response = await updateProfileImage(result.assets[0].uri);
              setProfileData(prev => prev ? { ...prev, preferences: { ...prev.preferences, wallpaperUrl: response.imageUrl } } : null);
              Toast.show({ type: 'success', text1: '¡Logrado!', text2: 'Foto actualizada correctamente' });
            } catch (error) {
              const apiError = error as ApiError;
              Toast.show({ type: 'error', text1: 'Algo salió mal', text2: apiError.message || 'No se pudo actualizar la foto' });
            } finally {
              setIsUploading(false);
            }
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

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
          <ProfileAvatar imageUrl={profileData?.preferences?.wallpaperUrl} onEditImage={handleUpdateImage} />

          <View style={styles.infoContainer}>
            <ProfileInfoRow label="Nombre" value={profileData?.nombre || ''} />
            <ProfileInfoRow label="Correo" value={profileData?.email || ''} />
            <ProfileInfoRow label="Rol" value={profileData?.rol || 'Usuario'} />
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Editar Información</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.passwordButton} onPress={() => router.push('/change-password')}>
            <Text style={styles.passwordButtonText}>Cambiar Contraseña</Text>
          </TouchableOpacity>
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
  editButton: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  passwordButton: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: 'transparent',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  passwordButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
});