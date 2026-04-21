import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken } from '@/src/services/api';

const App = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        if (token) {
          router.replace('/home');
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <Text style={styles.title}>¡Hola, Geckos!</Text>
        {loading && <ActivityIndicator size="large" color="#c91569" style={styles.loader} />}
      </SafeAreaView>
    </View>
  );
};

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
  loader: {
    marginTop: 20,
  },
});

export default App;