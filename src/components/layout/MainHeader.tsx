import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface MainHeaderProps {
  onToggleMenu: () => void;
}

export default function MainHeader({ onToggleMenu }: MainHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onToggleMenu} style={styles.iconButton}>
        <Feather name="menu" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>GeckChat</Text>

      <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/search')}>
        <Feather name="search" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
});