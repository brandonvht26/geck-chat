import { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mock Data: 3 documentos de prueba
const MOCK_DOCUMENTS = [
  {
    _id: '1',
    name: 'Informe_Final_Proyecto.pdf',
    type: 'pdf',
    createdAt: new Date('2026-04-15T10:30:00'),
  },
  {
    _id: '2',
    name: 'Diagrama_Arquitectura.png',
    type: 'image',
    createdAt: new Date('2026-04-20T14:45:00'),
  },
  {
    _id: '3',
    name: 'Notas_Reunion.txt',
    type: 'txt',
    createdAt: new Date('2026-05-01T09:15:00'),
  },
];

// Función para obtener color según tipo de documento
const getIconColor = (type: string) => {
  switch (type) {
    case 'pdf': return '#FF3B30'; // Rojo
    case 'image': return '#34C759'; // Verde
    case 'txt': return '#007AFF'; // Azul
    default: return '#8E8E93'; // Gris
  }
};

// Función para formatear fecha
const formatDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Componente de tarjeta de documento
const DocumentCard = ({ item }: { item: typeof MOCK_DOCUMENTS[0] }) => {
  const iconColor = getIconColor(item.type);
  
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      {/* Ícono dinámico según tipo */}
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Feather 
          name={item.type === 'pdf' ? 'file-text' : item.type === 'image' ? 'image' : 'file'} 
          size={24} 
          color={iconColor} 
        />
      </View>
      
      {/* Información del documento */}
      <View style={styles.infoContainer}>
        <Text style={styles.documentName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.documentDate}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      
      {/* Flecha opcional */}
      <Feather name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );
};

export default function DocumentsScreen() {
  const router = useRouter();
  const [documents] = useState(MOCK_DOCUMENTS);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header opcional */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Documentos</Text>
      </View>

      {/* Lista de documentos */}
      <FlatList
        data={documents}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <DocumentCard item={item} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="folder" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No tienes documentos</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
});
