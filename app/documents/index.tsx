import { useState, useMemo } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';
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
import { uploadDocument, deleteDocument, DocumentItem } from '@/src/services/item.service';
import { useDocuments } from '@/src/hooks/queries/useDocuments';
import { ApiError } from '@/src/services/api';

export default function DocumentsScreen() {
  const { user } = useAuth();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const { data: items = [], isLoading, refetch } = useDocuments(currentFolderId);
  const [sortBy, setSortBy] = useState('name_asc');

  const handleFolderPress = (folder: any) => {
    setFolderHistory(prev => [...prev, currentFolderId as string]);
    setCurrentFolderId(folder._id);
  };

  const handleGoBack = () => {
    const previousFolder = folderHistory[folderHistory.length - 1];
    const newHistory = folderHistory.slice(0, -1);
    setFolderHistory(newHistory);
    setCurrentFolderId(previousFolder || null);
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;

      const asset = result.assets[0];
      
      // Báscula de seguridad: Límite de 5MB (5 * 1024 * 1024 bytes)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (asset.size && asset.size > MAX_SIZE) {
        Alert.alert('Archivo muy pesado', 'Por favor, selecciona un archivo menor a 5MB.');
        return;
      }

      await uploadDocument(asset.uri, asset.name, asset.mimeType || 'application/octet-stream', currentFolderId);
      refetch();
      Alert.alert('Éxito', 'Documento subido correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir el documento');
    }
  };

  const handleDownload = async (item: any) => {
    try {
      const itemType = item.type || item.tipo || '';
      const itemName = item.name || item.nombre || 'documento';
      const itemContent = item.contenido || item.content || '';
      const safeFileName = itemName.replace(/[^a-zA-Z0-9.-]/g, '_');

      if (itemType === 'note' || itemType === 'code') {
        // Definimos el estilo base para el PDF
        const htmlContent = itemType === 'note' 
          ? `<div style="padding: 40px; font-family: sans-serif;">${itemContent}</div>`
          : `<html><body style="background: #1e1e1e; padding: 20px;">
               <pre style="color: #d4d4d4; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.5;">${itemContent}</pre>
             </body></html>`;

        // Generamos el PDF
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        
        // Renombramos el archivo temporal para que tenga el nombre real
        const pdfUri = `${FileSystem.documentDirectory}${safeFileName}.pdf`;
        await FileSystem.moveAsync({ from: uri, to: pdfUri });
        
        await Sharing.shareAsync(pdfUri);

      } else if (item.url || item.fileUrl) {
        // Descarga normal para archivos tradicionales
        const itemUrl = item.url || item.fileUrl;
        const extension = item.fileFormat ? `.${item.fileFormat.replace('.', '')}` : '';
        const finalName = safeFileName.includes('.') ? safeFileName : `${safeFileName}${extension}`;
        const fileUri = `${FileSystem.documentDirectory}${finalName}`;
        
        const download = await FileSystem.downloadAsync(itemUrl, fileUri);
        await Sharing.shareAsync(download.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el archivo para compartir');
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      Alert.alert('Éxito', 'Documento eliminado correctamente');
      refetch();
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

  const sortedDocuments = useMemo(() => {
    const sorted = [...items];
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
  }, [items, sortBy]);

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      <View className="p-4 border-b border-gray-200 dark:border-gray-700 flex-row items-center">
        {currentFolderId && (
          <TouchableOpacity onPress={handleGoBack} className="mr-3">
            <Text className="text-primary dark:text-primary-dark">← Volver</Text>
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold text-textMain dark:text-textMain-dark">Mis Documentos</Text>
      </View>

      <View className="flex-row p-2 gap-2 border-b border-gray-100 dark:border-gray-800 flex-wrap">
        <TouchableOpacity
          onPress={() => setSortBy('name_asc')}
          className={`px-3 py-1.5 rounded ${sortBy === 'name_asc' ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-xs ${sortBy === 'name_asc' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>A-Z</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortBy('name_desc')}
          className={`px-3 py-1.5 rounded ${sortBy === 'name_desc' ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-xs ${sortBy === 'name_desc' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>Z-A</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortBy('date_newest')}
          className={`px-3 py-1.5 rounded ${sortBy === 'date_newest' ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-xs ${sortBy === 'date_newest' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>Más recientes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortBy('type')}
          className={`px-3 py-1.5 rounded ${sortBy === 'type' ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-100 dark:bg-gray-800'}`}
        >
          <Text className={`text-xs ${sortBy === 'type' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>Tipo</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" className="text-primary dark:text-primary-dark" />
        </View>
      ) : (
        <FlatList
          data={sortedDocuments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center mt-8">
              <Text className="text-gray-500 dark:text-gray-400">No tienes documentos</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center p-3 border-b border-gray-100 dark:border-gray-800"
              onPress={() => item.type === 'folder' ? handleFolderPress(item) : undefined}
              disabled={item.type !== 'folder'}
            >
              <View className="flex-1">
                <Text className="text-base text-textMain dark:text-textMain-dark">{item.nombre || item.name}</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">{item.tipo || item.type || item.fileFormat}</Text>
              </View>
              {item.type !== 'folder' && (
                <>
                  <TouchableOpacity onPress={() => handleDownload(item)} className="p-2">
                    <Text className="text-primary dark:text-primary-dark">Descargar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(item)} className="p-2">
                    <Text className="text-red-500 dark:text-red-400">Eliminar</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        onPress={handleUpload}
        style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 }}
        className="absolute bottom-10 right-6 bg-blue-600 w-16 h-16 rounded-full justify-center items-center"
      >
        <Feather name="plus" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}
