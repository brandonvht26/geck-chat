import { useState, useMemo } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Feather, Ionicons } from '@expo/vector-icons';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/src/hooks/useAuth';
import { uploadDocument, deleteDocument, DocumentItem } from '@/src/services/item.service';
import { useDocuments } from '@/src/hooks/queries/useDocuments';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { toast } from 'sonner-native'; // 🚀 Importación de Sonner
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedFAB = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animatedStyle, { position: 'absolute', bottom: 24, right: 24, zIndex: 50 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
        className="w-14 h-14 rounded-full bg-primary dark:bg-primary-dark justify-center items-center shadow-lg shadow-primary/40 dark:shadow-black/50"
      >
        <Feather name="plus" size={28} color="#ffffff" />
      </Pressable>
    </Animated.View>
  );
};

export default function DocumentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const { data: items = [], isLoading, refetch } = useDocuments(currentFolderId);

  // 🚀 El filtro por defecto ahora son los más recientes
  const [sortBy, setSortBy] = useState('date_newest');

  const iconColor = colorScheme === 'dark' ? '#E5E7EB' : '#333333';

  const getFileMetadata = (item: any) => {
    const name = (item.nombre || item.name || '').toLowerCase();
    const type = (item.tipo || item.type || '').toLowerCase();

    if (type === 'folder') return { label: 'Carpeta', icon: 'folder', color: '#D9821E', bgColor: 'bg-secondary/10 dark:bg-secondary-dark/15' };

    const ext = name.split('.').pop();

    if (type === 'audio' || ['mp3', 'm4a', 'wav', 'aac'].includes(ext)) return { label: 'Nota de Audio', icon: 'musical-notes', color: '#8261D4', bgColor: 'bg-primary-dark/10 dark:bg-primary-dark/15' };
    if (type === 'video' || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return { label: 'Video Clip', icon: 'videocam', color: '#E14B4B', bgColor: 'bg-warning/10 dark:bg-warning-dark/15' };
    if (ext === 'pdf') return { label: 'Documento PDF', icon: 'document-attach', color: '#E14B4B', bgColor: 'bg-red-50 dark:bg-red-950/20' };
    if (['doc', 'docx'].includes(ext)) return { label: 'Microsoft Word', icon: 'document-text', color: '#2A72D4', bgColor: 'bg-blue-50 dark:bg-blue-950/20' };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { label: 'Hoja de Cálculo', icon: 'stats-chart', color: '#93BE38', bgColor: 'bg-tertiary/10 dark:bg-tertiary-dark/15' };
    if (type === 'code' || ['js', 'ts', 'tsx', 'json', 'html', 'css', 'py'].includes(ext)) return { label: 'Código Fuente', icon: 'code-slash', color: '#4B5563', bgColor: 'bg-gray-100 dark:bg-zinc-800' };
    if (type === 'note') return { label: 'Nota de Escritorio', icon: 'create', color: '#93BE38', bgColor: 'bg-tertiary/10 dark:bg-tertiary-dark/15' };

    return { label: ext ? `${ext.toUpperCase()} Archivo` : 'Archivo', icon: 'document', color: '#2A72D4', bgColor: 'bg-primary/10 dark:bg-primary-dark/15' };
  };

  const handleFolderPress = (folder: any) => {
    setFolderHistory(prev => [...prev, currentFolderId as string]);
    setCurrentFolderId(folder._id);
  };

  const handleGoBack = () => {
    if (!currentFolderId) {
      router.back();
      return;
    }
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
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('Archivo muy pesado', 'Por favor, selecciona un archivo menor a 5MB.');
        return;
      }
      await uploadDocument(asset.uri, asset.name, asset.mimeType || 'application/octet-stream', currentFolderId);
      refetch();
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
        const htmlContent = itemType === 'note'
          ? `<div style="padding: 40px; font-family: sans-serif;">${itemContent}</div>`
          : `<html><body style="background: #1e1e1e; padding: 20px;"><pre style="color: #d4d4d4; font-family: monospace; font-size: 14px;">${itemContent}</pre></body></html>`;

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const pdfUri = `${FileSystem.documentDirectory}${safeFileName}.pdf`;
        await FileSystem.moveAsync({ from: uri, to: pdfUri });
        await Sharing.shareAsync(pdfUri);
      } else if (item.url || item.fileUrl) {
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

  const confirmDelete = (item: DocumentItem) => {
    Alert.alert('Eliminar documento', `¿Seguro que quieres eliminar "${item.name || item.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          // 🚀 Control manual del Toast para evitar falsos negativos con React Query
          const toastId = toast.loading('Eliminando...');
          try {
            await deleteDocument(item._id);
            toast.success('Documento eliminado correctamente', { id: toastId });
            refetch(); // Refrescamos la lista DESPUÉS de mostrar el éxito
          } catch (error: any) {
            toast.error(error.message || 'No se pudo eliminar el documento', { id: toastId });
          }
        }
      },
    ]);
  };

  const sortedDocuments = useMemo(() => {
    const sorted = [...items];
    switch (sortBy) {
      case 'name_asc': return sorted.sort((a, b) => (a.nombre || a.name || '').localeCompare(b.nombre || b.name || ''));
      case 'name_desc': return sorted.sort((a, b) => (b.nombre || b.name || '').localeCompare(a.nombre || a.name || ''));
      case 'date_newest': return sorted.sort((a, b) => b._id.localeCompare(a._id));
      case 'type': return sorted.sort((a, b) => (a.fileFormat || a.type || '').localeCompare(b.fileFormat || b.type || ''));
      default: return sorted;
    }
  }, [items, sortBy]);

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">

      <View style={{ paddingTop: insets.top }} className="bg-white dark:bg-authEnd-dark z-20">
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Pressable onPress={handleGoBack} className="p-2 -ml-2 active:opacity-60">
            <Feather name="arrow-left" size={24} color={iconColor} />
          </Pressable>
          <Text className="text-2xl font-snpro-bold text-textMain dark:text-textMain-dark tracking-tight">
            {currentFolderId ? 'Carpeta' : 'Mis Documentos'}
          </Text>
          <View className="p-2 -mr-2 opacity-0" pointerEvents="none"><Feather name="arrow-left" size={24} /></View>
        </View>
      </View>

      <View className="border-b border-gray-100 dark:border-gray-800 pb-2 bg-white dark:bg-authEnd-dark z-10">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
          {[
            { id: 'date_newest', label: 'Recientes' },
            { id: 'name_asc', label: 'A-Z' },
            { id: 'name_desc', label: 'Z-A' },
            { id: 'type', label: 'Tipo' }
          ].map(filter => (
            <Pressable
              key={filter.id}
              onPress={() => setSortBy(filter.id)}
              className={`px-4 py-2 rounded-full border ${sortBy === filter.id ? 'bg-primary dark:bg-primary-dark border-primary' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'}`}
            >
              <Text className={`text-xs font-nunito-bold ${sortBy === filter.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" className="text-primary dark:text-primary-dark" />
        </View>
      ) : (
        <FlatList
          data={sortedDocuments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20 px-8">
              <View className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary-dark/20 justify-center items-center mb-6">
                <Ionicons name="document-text-outline" size={40} className="text-primary dark:text-primary-dark" />
              </View>
              <Text className="text-lg font-nunito-bold text-textMain dark:text-textMain-dark mb-2 text-center">Carpeta vacía</Text>
              <Text className="text-base text-gray-500 dark:text-gray-400 text-center font-nunito-regular">Usa el botón inferior para subir archivos.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = getFileMetadata(item);

            return (
              <Pressable
                className="flex-row items-center justify-between p-4 mb-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl"
                onPress={() => item.type === 'folder' ? handleFolderPress(item) : undefined}
              >
                <View className="flex-row items-center flex-1">
                  <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${meta.bgColor}`}>
                    <Ionicons name={meta.icon as any} size={22} color={meta.color} />
                  </View>
                  <View className="flex-1 pr-4">
                    <Text className="text-base font-nunito-bold text-textMain dark:text-textMain-dark" numberOfLines={1}>
                      {item.nombre || item.name}
                    </Text>
                    <Text className="text-xs font-nunito-regular text-gray-500 dark:text-gray-400 mt-0.5">
                      {meta.label}
                    </Text>
                  </View>
                </View>

                {item.type !== 'folder' && (
                  <View className="flex-row items-center gap-2">
                    <Pressable onPress={() => handleDownload(item)} className="p-2 bg-white dark:bg-zinc-700 rounded-full border border-gray-200 dark:border-zinc-600">
                      <Feather name="download" size={16} color={colorScheme === 'dark' ? '#E5E7EB' : '#4B5563'} />
                    </Pressable>
                    <Pressable onPress={() => confirmDelete(item)} className="p-2 bg-red-50 dark:bg-red-900/30 rounded-full border border-red-100 dark:border-red-900/50">
                      <Feather name="trash-2" size={16} color="#E14B4B" />
                    </Pressable>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}

      <AnimatedFAB onPress={handleUpload} />
    </View>
  );
}