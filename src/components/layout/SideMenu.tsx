import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/src/hooks/useAuth';
import Placeholder from '@/src/components/ui/Placeholder';

export default function SideMenu() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Placeholder title="Configuración de perfil" />
      <Placeholder title="Configuración de sistema" />
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoutButton: {
    padding: 16,
    margin: 8,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});