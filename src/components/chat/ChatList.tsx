import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getUserChats, Chat } from '@/src/services/chat.service';
import { useAuth } from '@/src/hooks/useAuth'; // Ajusta esta ruta si es diferente

export default function ChatList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const authData = useAuth();
  console.log("🔑 RADAR HOOK AUTH:", JSON.stringify(authData, null, 2));
  const user = authData?.user; // Mantenemos esto por si acaso, pero el log nos dirá la verdad

  // 1. LA PLOMERÍA (Lógica de obtención de datos)
  const fetchChats = useCallback(async () => {
    console.log("📡 [ChatList] Pidiendo chats al servidor...");
    setIsLoading(true);
    try {
      const response = await getUserChats();
      console.log("✅ [ChatList] Chats recibidos:", response?.length);

      // Ordenamos para que el más reciente salga arriba
      const sortedChats = response?.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ) || [];

      setChats(sortedChats);
    } catch (error) {
      console.error("❌ [ChatList] Error obteniendo chats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. EL TIMBRE (Ciclo de vida al volver a la pantalla)
  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  // 3. LA FACHADA (Renderizado visual)
  return (
    <View style={styles.container}>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No tienes conversaciones</Text>}
          renderItem={({ item }) => {
            // 1. SACAMOS AL USUARIO AL PASILLO (Variable Global de la tarjeta)
            const otherUser = item.isGroup ? null : item.participants?.find(p =>
              (p?._id || p) !== (user?._id)
            );

            // 2. Lógica para determinar el título
            let displayTitle = 'Chat';
            if (item.isGroup) {
              displayTitle = item.workspaceId?.name || 'Grupo sin nombre';
            } else {
              displayTitle = otherUser?.name || otherUser?.username || 'Usuario';
            }

            // 3. Determinar la URL de la imagen
            const imageUrl = item.isGroup
              ? item.workspaceId?.imageUrl
              : otherUser?.avatarUrl || otherUser?.profilePicture;

            return (
              <TouchableOpacity
                style={styles.chatCard}
                onPress={() => router.push(`/chat/${item._id}`)}
              >
                {/* 4. Renderizado condicional del Avatar */}
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: item.isGroup ? '#E3F2FD' : '#F5F5F5' }]}>
                    <Feather name={item.isGroup ? "users" : "user"} size={24} color={item.isGroup ? "#1976D2" : "#757575"} />
                  </View>
                )}

                {/* Textos */}
                <View style={styles.textContainer}>
                  <Text style={styles.chatTitle}>{displayTitle}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {typeof item.lastMessage === 'string'
                      ? item.lastMessage
                      : (item.lastMessage?.content || item.lastMessage?.contenido || 'Envía un mensaje para iniciar...')}
                  </Text>
                </View>

                <Feather name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  reloadButton: { backgroundColor: '#007AFF', padding: 10, margin: 10, borderRadius: 8 },
  reloadText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#888' },
  chatCard: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  chatTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  lastMessage: { fontSize: 14, color: '#888', marginTop: 4 }
});