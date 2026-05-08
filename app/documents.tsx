import { useState, useEffect, useMemo } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/src/hooks/useAuth';
import { getDesktopItems, uploadDocument, deleteDocument, DocumentItem } from '@/src/services/item.service';
import { ApiError } from '@/src/services/api';

export default function DocumentsScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name_asc');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const items = await getDesktopItems();
      console.log('[loadDocuments] Items obtenidos:', items);
      setDocuments(items || []);
    } catch (error) {
      const err = error as ApiError;
      console.error('[loadDocuments] Error:', err);
      Alert.alert('Error', err.message || 'No se pudieron cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  // Se ejecuta cuando user cambia (de null a objeto)
  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      console.log('[handleUpload] Resultado de DocumentPicker:', result);

      if (result.canceled) {
        console.log('[handleUpload] Usuario canceló la selección');
        return;
      }

      const { uri, name, mimeType, size } = result.assets[0];
      console.log('[handleUpload] Archivo seleccionado:', { uri, name, mimeType, size });

      await uploadDocument(uri, name, mimeType);
      Alert.alert('Éxito', 'Archivo subido correctamente');
      loadDocuments();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[handleUpload] Error Axios:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        console.error('[handleUpload] Error desconocido:', error);
      }
      const err = error as ApiError;
      Alert.alert('Error', err.message || 'No se pudo subir el archivo');
    }
  };

  const handleDownload = async (item: DocumentItem) => {
    try {
      // 1. Extraer la extensión real del nombre original del archivo (ej. de "documento.pdf" extrae ".pdf")
      const originalExtension = item.name.includes('.') ? `.${item.name.split('.').pop()}` : '';

      // 2. Obtener el nombre base sin la extensión
      const nameWithoutExtension = item.name.includes('.') ? item.name.substring(0, item.name.lastIndexOf('.')) : item.name;

      // 3. Limpiar el nombre base de caracteres problemáticos
      const baseName = nameWithoutExtension.replace(/[^a-zA-Z0-9]/g, '_');

      // 4. Construir el URI final garantizando la extensión original
      const safeFileName = `${baseName}${originalExtension}`;
      const fileUri = `${FileSystem.documentDirectory}${safeFileName}`;

      // 1. Imprime la URL exacta de donde estamos descargando
      console.log('[Download] URL Origen:', item.url);

      // Verificar si el archivo ya existe en caché
      const cachedFileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (cachedFileInfo.exists) {
        console.log('[Download] Leyendo desde caché local');
        
        // Verificar tamaño del archivo en caché
        if (cachedFileInfo.exists && cachedFileInfo.size < 500) {
          console.warn('[Download] ALERTA: El archivo en caché es sospechosamente pequeño. Posible error de Cloudinary.');
        }
        
        // Forzar el prefijo file:// para el Sharing
        const shareUri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;
        await Sharing.shareAsync(shareUri, { UTI: 'public.item' });
      } else {
        console.log('[Download] Descargando archivo...');
        const downloadResult = await FileSystem.downloadAsync(item.url, fileUri);
        
        // 2. Realiza la descarga y guarda el resultado
        console.log('[Download] Resultado HTTP:', downloadResult.status, downloadResult.headers);
        
        // 3. Verifica el archivo físico en el celular
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        console.log('[Download] Info del archivo local:', fileInfo);
        
        // 4. Validación de tamaño (si pesa menos de 500 bytes, probablemente sea un error de Cloudinary)
        if (fileInfo.exists && fileInfo.size < 500) {
          console.warn('[Download] ALERTA: El archivo es sospechosamente pequeño. Posible error de Cloudinary.');
        }
        
        // 5. Forzar el prefijo file:// para el Sharing por seguridad en iOS/Android
        const shareUri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;
        await Sharing.shareAsync(shareUri, { UTI: 'public.item' });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[handleDownload] Error Axios:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      } else {
        console.error('[handleDownload] Error desconocido:', error);
      }
      const err = error as ApiError;
      Alert.alert('Error', err.message || 'No se pudo descargar el archivo');
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      Alert.alert('Éxito', 'Documento eliminado correctamente');
      loadDocuments();
    } catch (error) {
      const err = error as ApiError;
      Alert.alert('Error', err.message || 'No se pudo eliminar el documento');
    }
  };

  const confirmDelete = (item: DocumentItem) => {
    Alert.alert(
      'Eliminar documento',
      `¿Seguro que quieres eliminar "${item.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => executeDelete(item._id),
        },
      ]
    );
  };

  // useMemo evita recálculos innecesarios en cada render
  const sortedDocuments = useMemo(() => {
    const sorted = [...documents];
    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => {
          const nameA = a.nombre || a.name || '';
          const nameB = b.nombre || b.name || '';
          return nameA.localeCompare(nameB);
        });
      case 'name_desc':
        return sorted.sort((a, b) => {
          const nameA = a.nombre || a.name || '';
          const nameB = b.nombre || b.name || '';
          return nameB.localeCompare(nameA);
        });
      case 'date_newest':
        return sorted.sort((a, b) => b._id.localeCompare(a._id));
      case 'type':
        return sorted.sort((a, b) => {
          const typeA = a.fileFormat || a.tipo || a.type || '';
          const typeB = b.fileFormat || b.tipo || b.type || '';
          return typeA.localeCompare(typeB);
        });
      default:
        return sorted;
    }
  }, [documents, sortBy]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Mis Documentos</Text>
      </View>

      <View style={{ flexDirection: 'row', padding: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: '#eee', flexWrap: 'wrap' }}>
        <TouchableOpacity
          onPress={() => setSortBy('name_asc')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: sortBy === 'name_asc' ? '#007AFF' : '#f0f0f0',
            borderRadius: 4,
          }}
        >
          <Text style={{ color: sortBy === 'name_asc' ? '#fff' : '#333', fontSize: 12 }}>A-Z</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortBy('name_desc')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: sortBy === 'name_desc' ? '#007AFF' : '#f0f0f0',
            borderRadius: 4,
          }}
        >
          <Text style={{ color: sortBy === 'name_desc' ? '#fff' : '#333', fontSize: 12 }}>Z-A</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortBy('date_newest')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: sortBy === 'date_newest' ? '#007AFF' : '#f0f0f0',
            borderRadius: 4,
          }}
        >
          <Text style={{ color: sortBy === 'date_newest' ? '#fff' : '#333', fontSize: 12 }}>Más recientes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortBy('type')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: sortBy === 'type' ? '#007AFF' : '#f0f0f0',
            borderRadius: 4,
          }}
        >
          <Text style={{ color: sortBy === 'type' ? '#fff' : '#333', fontSize: 12 }}>Tipo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedDocuments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text>No tienes documentos</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#eee',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16 }}>{item.nombre || item.name}</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>{item.tipo || item.type || item.fileFormat}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDownload(item)}
              style={{ padding: 8 }}
            >
              <Text style={{ color: '#007AFF' }}>Descargar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDelete(item)}
              style={{ padding: 8 }}
            >
              <Text style={{ color: '#FF3B30' }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        onPress={handleUpload}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          backgroundColor: '#007AFF',
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 24 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
