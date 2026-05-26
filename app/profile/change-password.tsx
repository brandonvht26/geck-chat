import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useRouter } from 'expo-router';
import { updatePassword } from '@/src/services/user.service';
import { ApiError } from '@/src/services/api';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showPasswordNuevo, setShowPasswordNuevo] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!passwordActual.trim() || !passwordNuevo.trim()) {
      toast.error('Atención', { description: 'Todos los campos son requeridos' });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W_]).{6,}$/;
    if (!passwordRegex.test(passwordNuevo.trim())) {
      toast.error('Contraseña débil', { 
        description: 'Mínimo 6 caracteres, combinando mayúsculas, minúsculas y un número o carácter especial.' 
      });
      return;
    }

    setLoading(true);
    try {
      await updatePassword(passwordActual, passwordNuevo);
      toast.success('¡Logrado!', { description: 'Contraseña actualizada correctamente' });
      setPasswordActual('');
      setPasswordNuevo('');
      router.back();
    } catch (error) {
      const apiError = error as ApiError;
      toast.error('Algo salió mal', { description: apiError.message || 'No se pudo actualizar la contraseña' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Contraseña Actual</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Ingresa tu contraseña actual"
            secureTextEntry={!showPasswordActual}
            value={passwordActual}
            onChangeText={setPasswordActual}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPasswordActual(!showPasswordActual)}
          >
            <Feather
              name={showPasswordActual ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Nueva Contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Ingresa tu nueva contraseña"
            secureTextEntry={!showPasswordNuevo}
            value={passwordNuevo}
            onChangeText={setPasswordNuevo}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPasswordNuevo(!showPasswordNuevo)}
          >
            <Feather
              name={showPasswordNuevo ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.button}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Guardar Cambios</Text>
          </TouchableOpacity>
        )}
      </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
  },
  button: {
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
