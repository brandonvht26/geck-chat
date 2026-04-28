import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ProfileAvatar from '@/src/components/profile/ProfileAvatar';
import ProfileInfoRow from '@/src/components/profile/ProfileInfoRow';
import { getUserProfile, updateProfileImage, deleteAccount, UserProfile } from '@/src/services/user.service';
import { ApiError } from '@/src/services/api';
import { useAuth } from '@/src/hooks/useAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const getExpectedConfirmation = () => {
    if (!profileData?.nombre) return '';
    const nameWithoutSpaces = profileData.nombre.replace(/\s+/g, '');
    return `delete_${nameWithoutSpaces}`;
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    try {
      await deleteAccount(confirmationText);
      Toast.show({ type: 'success', text1: 'Cuenta eliminada', text2: 'Tus datos han sido borrados permanentemente' });
      await signOut();
    } catch (error) {
      const apiError = error as ApiError;
      Toast.show({ type: 'error', text1: 'Algo salió mal', text2: apiError.message || 'No se pudo eliminar la cuenta' });
    } finally {
      setIsDeleting(false);
      setConfirmationText('');
    }
  };

  const isConfirmationValid = confirmationText === getExpectedConfirmation();

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

          <View style={styles.dangerZone}>
            <Text style={styles.dangerZoneTitle}>Zona de Peligro</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteModal(true)}>
              <Text style={styles.deleteButtonText}>Eliminar mi cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Eliminar Cuenta</Text>
            <Text style={styles.modalDescription}>
              Esta acción es irreversible. Se borrarán todos tus mensajes, archivos y datos.
            </Text>
            <Text style={styles.modalInstruction}>
              Para confirmar, escribe: <Text style={styles.modalCode}>{getExpectedConfirmation()}</Text>
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Escribe el código de confirmación"
              value={confirmationText}
              onChangeText={setConfirmationText}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setConfirmationText('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, !isConfirmationValid && styles.modalConfirmDisabled]}
                onPress={handleDeleteAccount}
                disabled={!isConfirmationValid || isDeleting}
              >
                <Text style={styles.modalConfirmText}>
                  {isDeleting ? 'Eliminando...' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  dangerZone: {
    marginHorizontal: 16,
    marginTop: 48,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 12,
  },
  deleteButton: {
    padding: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#dc3545',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalInstruction: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  modalCode: {
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#dc3545',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmDisabled: {
    backgroundColor: '#ccc',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});