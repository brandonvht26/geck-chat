import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const getErrorMessage = (error: unknown): string => {
    const err = error as Error;
    return err?.message || 'Ocurrió un problema de conexión. Por favor, inténtalo más tarde.';
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      Toast.show({
        type: 'success',
        text1: 'Bienvenido',
        text2: 'Has iniciado sesión correctamente',
      });
      router.replace('/home');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: getErrorMessage(error),
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <TextInput
              placeholder="Correo electrónico"
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, errors.email && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Contraseña"
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              <Pressable style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
              </Pressable>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>
        )}
      />

      <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotLink}>
        <Text style={styles.forgotLinkText}>¿Olvidaste tu contraseña?</Text>
      </Pressable>

      <Button
        title={loading ? 'Ingresando...' : 'Iniciar sesión'}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      />

      <Pressable onPress={() => router.push('/register')} style={styles.link}>
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