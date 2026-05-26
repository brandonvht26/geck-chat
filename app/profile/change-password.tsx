import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useRouter } from 'expo-router';
import { updatePassword } from '../../src/services/user.service';
import { getErrorMessage } from '../../src/services/api';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

const AnimatedInput = ({ label, placeholder, value, onChangeText, innerRef, returnKeyType, onSubmitEditing }: any) => {
  const scale = useSharedValue(1);
  const [showPassword, setShowPassword] = useState(false);
  const { colorScheme } = useColorScheme();
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#fff' : '#333';
  const placeholderColor = isDark ? 'rgba(255,255,255,0.5)' : '#999';
  const borderColor = isDark ? '#444' : '#ccc';
  const bgColor = isDark ? '#2A2A2A' : '#fff';

  return (
    <Animated.View style={[animatedStyle, { marginBottom: 20 }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <View style={[styles.passwordContainer, { borderColor, backgroundColor: bgColor }]}>
        <Feather name="lock" size={20} color={isDark ? '#aaa' : '#666'} style={{ paddingLeft: 12 }} />
        <TextInput
          ref={innerRef}
          style={[styles.input, { color: textColor }]}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => { scale.value = withSpring(1.02, { damping: 12 }); }}
          onBlur={() => { scale.value = withSpring(1); }}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={returnKeyType === 'done'}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={isDark ? '#aaa' : '#666'} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const AnimatedButton = ({ onPress, loading, text }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        disabled={loading}
        onPressIn={() => { scale.value = withSpring(0.94, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
        style={styles.button}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{text}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [loading, setLoading] = useState(false);
  
  const nuevoPasswordRef = useRef<TextInput>(null);

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
    } catch (error: any) {
      toast.error('Algo salió mal', { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const isDark = colorScheme === 'dark';
  const containerBg = isDark ? '#1E1E1E' : '#fff';
  const headerBorderColor = isDark ? '#333' : '#e0e0e0';
  const textColor = isDark ? '#fff' : '#333';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
      <View style={[styles.header, { borderBottomColor: headerBorderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Cambiar Contraseña</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <AnimatedInput
          label="Contraseña Actual"
          placeholder="Ingresa tu contraseña actual"
          value={passwordActual}
          onChangeText={setPasswordActual}
          returnKeyType="next"
          onSubmitEditing={() => nuevoPasswordRef.current?.focus()}
        />

        <AnimatedInput
          label="Nueva Contraseña"
          placeholder="Ingresa tu nueva contraseña"
          value={passwordNuevo}
          onChangeText={setPasswordNuevo}
          innerRef={nuevoPasswordRef}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        <View style={{ marginTop: 12 }}>
          <AnimatedButton onPress={handleSave} loading={loading} text="Guardar Cambios" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 14,
  },
  button: {
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
