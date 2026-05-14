import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Pressable } from 'react-native';
import { useForm } from '@tanstack/react-form';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { loginSchema } from '@/src/schemas/auth.schema';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      try {
        const parsedData = loginSchema.parse(value);
        await signIn(parsedData.email, parsedData.password);
        router.replace('/home');
      } catch (error: any) {
        Toast.show({ type: 'error', text1: error.errors ? error.errors[0].message : 'Error al iniciar sesión' });
      }
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>

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

      <Pressable onPress={() => router.push('/auth/forgot-password')} style={styles.forgotLink}>
        <Text style={styles.forgotLinkText}>¿Olvidaste tu contraseña?</Text>
      </Pressable>

      <Button
        title={loading ? 'Ingresando...' : 'Iniciar sesión'}
        onPress={form.handleSubmit}
        disabled={loading}
      />

      <Pressable onPress={() => router.push('/auth/register')} style={styles.link}>
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
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
  forgotLink: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotLinkText: {
    color: '#007AFF',
  },
  link: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
  },
});
