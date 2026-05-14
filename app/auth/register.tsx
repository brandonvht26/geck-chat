import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Pressable } from 'react-native';
import { useForm } from '@tanstack/react-form';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { registerSchema } from '@/src/schemas/auth.schema';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      try {
        const parsedData = registerSchema.parse(value);
        await signUp(parsedData.name, parsedData.email, parsedData.password);
        Toast.show({
          type: 'success',
          text1: '¡Logrado!',
          text2: 'Por favor, revisa tu correo electrónico para verificar tu cuenta antes de iniciar sesión.',
        });
        setTimeout(() => router.replace('/auth/login'), 3000);
      } catch (error: any) {
        Toast.show({ type: 'error', text1: error.errors ? error.errors[0].message : 'Error en el registro' });
      }
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <form.Field name="name">
        {(field) => (
          <View>
            <TextInput
              placeholder="Nombre"
              autoCapitalize="words"
              style={[styles.input, field.state.meta.errors.length > 0 && styles.inputError]}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              value={field.state.value}
            />
            {field.state.meta.errors.length > 0 && (
              <Text style={styles.errorText}>{field.state.meta.errors[0]}</Text>
            )}
          </View>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <View>
            <TextInput
              placeholder="Correo electrónico"
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, field.state.meta.errors.length > 0 && styles.inputError]}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              value={field.state.value}
            />
            {field.state.meta.errors.length > 0 && (
              <Text style={styles.errorText}>{field.state.meta.errors[0]}</Text>
            )}
          </View>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <View>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Contraseña"
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput, field.state.meta.errors.length > 0 && styles.inputError]}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                value={field.state.value}
              />
              <Pressable style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
              </Pressable>
            </View>
            {field.state.meta.errors.length > 0 && (
              <Text style={styles.errorText}>{field.state.meta.errors[0]}</Text>
            )}
          </View>
        )}
      </form.Field>

      <Button
        title={loading ? 'Registrando...' : 'Registrarse'}
        onPress={form.handleSubmit}
        disabled={loading}
      />

      <Pressable onPress={() => router.push('/auth/login')} style={styles.link}>
        <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </Pressable>

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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  link: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
  },
});
