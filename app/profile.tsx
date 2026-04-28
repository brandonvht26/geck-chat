import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ProfileAvatar from '@/src/components/profile/ProfileAvatar';
import ProfileInfoRow from '@/src/components/profile/ProfileInfoRow';
import Placeholder from '@/src/components/ui/Placeholder';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <ProfileAvatar />

        <View style={styles.infoContainer}>
          <ProfileInfoRow label="Nombre" value="Gecko" />
          <ProfileInfoRow label="Correo" value="gecko@epn.edu.ec" />
          <ProfileInfoRow label="Rol" value="Usuario" />
        </View>

        <Placeholder title="Editar Perfil" />
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
    paddingTop: 24,
  },
  infoContainer: {
    marginTop: 24,
  },
});