import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView>
        <Text style={styles.title}>Home</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(36, 235, 142, 0.82)',
  },
  title: {
    fontSize: 50,
    color: '#c91569',
    fontWeight: 'bold',
  },
});