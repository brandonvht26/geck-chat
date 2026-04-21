import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/src/hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await signIn(email, password);
      Toast.show({
        type: 'success',
        text1: 'Bienvenido',
        text2: 'Has iniciado sesión correctamente',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: (error as Error).message,
      });
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title={loading ? 'Ingresando...' : 'Iniciar sesión'} onPress={handleLogin} disabled={loading} />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
});