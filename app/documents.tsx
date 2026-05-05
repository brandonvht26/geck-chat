import { useState, useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { getAllDocuments, uploadDocument } from '@/src/services/item.service';

// Etiqueta oficial del documento según el backend
interface DocumentItem {
  _id: string;
  name: string;
  type: string;
  fileFormat?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Función para obtener ícono dinámico según tipo y formato
const getIconForType = (item: any) => {
  if (item.type === 'folder') {
    return (
      <View style={[styles.iconContainer, { backgroundColor: '#FF950015' }]}>
        <Feather name="folder" size={24} color="#FF9500" />
      </View>
    );
  }

  if (item.type === 'note') {
    return (
      <View style={[styles.iconContainer, { backgroundColor: '#5856D615' }]}>
        <Feather name="file-text" size={24} color="#5856D6" />
      </View>
    );
  }

  if (item.type === 'file') {
    const format = item.fileFormat?.toLowerCase() || '';

    // PDF - Rojo
    if (format === 'pdf') {
      return (
        <View style={[styles.iconContainer, { backgroundColor: '#FF3B3015' }]}>
          <Feather name="file-text" size={24} color="#FF3B30" />
        </View>
      );
    }

    // Imagen - Verde
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(format)) {
      return (
        <View style={[styles.iconContainer, { backgroundColor: '#34C75915' }]}>
          <Feather name="image" size={24} color="#34C759" />
        </View>
      );
    }

    // Archivo genérico - Azul
    return (
      <View style={[styles.iconContainer, { backgroundColor: '#007AFF15' }]}>
        <Feather name="file" size={24} color="#007AFF" />
      </View>
    );
  }

  // Tipo desconocido - Gris
  return (
    <View style={[styles.iconContainer, { backgroundColor: '#8E8E9315' }]}>
      <Feather name="file" size={24} color="#8E8E93" />
    </View>
  );
};

// Función para formatear fecha
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Componente de tarjeta de documento
const DocumentCard = ({ item }: { item: any }) => {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      {/* Ícono dinámico según tipo */}
      {getIconForType(item)}

      {/* Información del documento */}
      <View style={styles.infoContainer}>
        <Text style={styles.documentName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.documentDate}>
          {formatDate(item.createdAt || item.updatedAt)}
        </Text>
      </View>

      {/* Flecha opcional */}
      <Feather name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );
};

export default function DocumentsScreen() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const items = await getAllDocuments();
      setDocuments(items);
    } catch (error) {
      console.error('❌ [Documents] Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const { uri, name, mimeType } = result.assets[0];
      
      setUploading(true);
      Alert.alert('Subiendo...', 'Por favor espera mientras se sube el archivo.');

      // Llamada simplificada al servicio
      await uploadDocument(uri, name, mimeType);

      Alert.alert('Éxito', 'Archivo subido correctamente.');
      fetchDocuments();
    } catch (error) {
      console.error('❌ [Documents] Error uploading:', error);
      Alert.alert('Error', 'No se pudo subir el archivo.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  const sortedDocuments = [...documents].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Documentos</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <TouchableOpacity 
          style={[styles.filterChip, sortBy === 'date' && styles.filterChipActive]} 
          onPress={() => setSortBy('date')}
        >
          <Text style={[styles.filterChipText, sortBy === 'date' && styles.filterChipTextActive]}>Fecha</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, sortBy === 'name' && styles.filterChipActive]} 
          onPress={() => setSortBy('name')}
        >
          <Text style={[styles.filterChipText, sortBy === 'name' && styles.filterChipTextActive]}>Nombre</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, sortBy === 'type' && styles.filterChipActive]} 
          onPress={() => setSortBy('type')}
        >
          <Text style={[styles.filterChipText, sortBy === 'type' && styles.filterChipTextActive]}>Tipo</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Lista de documentos */}
      <FlatList
        data={sortedDocuments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <DocumentCard item={item} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="folder" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No tienes documentos</Text>
          </View>
        }
      />

      {/* FAB para subir documento */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Feather name="plus" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    gap: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 14,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
});
