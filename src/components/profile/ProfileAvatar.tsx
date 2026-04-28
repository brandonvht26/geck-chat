import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function ProfileAvatar() {
  return (
    <View style={styles.container}>
      <Feather name="user" size={40} color="gray" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});