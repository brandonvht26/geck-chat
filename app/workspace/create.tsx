import { useState } from 'react';
import {
  View,
  Image,
  TextInput,
  StyleSheet,
  Text,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { createWorkspace, updateWorkspaceImage } from '@/src/services/workspace.service';
import { ApiError } from '@/src/services/api';

export default function CreateWorkspaceScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const goBackSafely = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleCreate = async (): Promise<void> => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Campo requerido',
        text2: 'El nombre del workspace es obligatorio',
      });
      return;
    }

    setIsLoading(true);
    try {
      const newWorkspace = await createWorkspace(name.trim(), description.trim());

      if (imageUri) {
        try {
          await updateWorkspaceImage(newWorkspace.id, imageUri);
          Toast.show({
            type: 'success',
            text1: 'Grupo creado con imagen exitosamente',
          });
        } catch (error: any) {
          if (error.message === 'ENDPOINT_PENDING') {
            Toast.show({
              type: 'info',
              text1: 'Grupo creado. La foto de perfil se sincronizará cuando el servidor se actualice.',
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Grupo creado, pero no pudimos subir la imagen.',
            });
          }
        }
      }

      Toast.show({
        type: 'success',
        text1: 'El espacio de trabajo ha sido generado',
      });
      setTimeout(() => {
        goBackSafely();
      }, 2000);
    } catch (error) {
      const apiError = error as ApiError & { response?: { data?: { message?: string } } };
      if (!apiError.response) {
        Toast.show({
          type: 'error',
          text1: 'Revise su conexión. No hay red',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: apiError.response?.data?.message || 'Error al crear el espacio',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable onPress={goBackSafely} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <Text style={styles.title}>Nuevo Workspace</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.form}>
          <TouchableOpacity onPress={pickImage} className="items-center justify-center self-center mb-6 w-24 h-24 rounded-full bg-black/30 border border-white/20 overflow-hidden">
            {imageUri ? (
              <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Feather name="camera" size={32} color="#9ca3af" />
            )}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              placeholder="Ingresa el nombre"
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoCapitalize="words"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              placeholder="Describe el propósito del workspace"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={250}
            />
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={isLoading}
            style={[styles.button, isLoading && styles.buttonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Crear Workspace</Text>
            )}
          </Pressable>
        </View>

        <Toast />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  cancelButton: {
    padding: 4,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a0c4ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
