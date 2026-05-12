import { View, TextInput, TouchableOpacity, Text, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';

interface ChatInputProps {
  content: string;
  setContent: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  isRecording?: boolean;
  onStartRecord?: () => void;
  onStopRecord?: () => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

export default function ChatInput({
  content,
  setContent,
  onSend,
  onAttach,
  isRecording,
  onStartRecord,
  onStopRecord,
  isEditing,
  onCancelEdit
}: ChatInputProps) {
  const hasContent = content.trim().length > 0;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.85, duration: 300, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  return (
    <View className="flex-row items-end p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      {/* Botón Adjuntar */}
      <TouchableOpacity 
        onPress={onAttach}
        className="mb-1 mr-2 bg-green-500 rounded-full px-4 py-2.5"
      >
        <Text className="text-white font-semibold">Adjuntar</Text>
      </TouchableOpacity>

      {/* Input de Texto */}
      <TextInput
        className="flex-1 min-h-[40px] max-h-[100px] bg-gray-100 dark:bg-gray-800 dark:text-white rounded-2xl px-4 py-2 text-base mb-1"
        value={content}
        onChangeText={setContent}
        placeholder={isEditing ? 'Editando mensaje...' : 'Escribe un mensaje...'}
        placeholderTextColor="#999"
        multiline
      />

      {/* Botón Cancelar Edición */}
      {isEditing && onCancelEdit && (
        <TouchableOpacity
          onPress={onCancelEdit}
          className="ml-2 mb-1 w-9 h-9 items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full"
        >
          <Feather name="x" size={20} color="#666" />
        </TouchableOpacity>
      )}

      {/* Botón Enviar / Micrófono */}
      {hasContent || isEditing ? (
        <TouchableOpacity
          onPress={onSend}
          disabled={!hasContent}
          className={`ml-2 mb-1 w-10 h-10 items-center justify-center rounded-full ${!hasContent ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary dark:bg-primary-dark'}`}
        >
          <Feather name={isEditing ? 'check' : 'send'} size={20} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View className="flex-row items-center">
          {isRecording && (
            <Text className="text-xs text-red-500 mr-2">← Desliza para cancelar</Text>
          )}
          <TouchableOpacity
            onLongPress={onStartRecord}
            onPressOut={onStopRecord}
            activeOpacity={0.7}
            className={`ml-2 mb-1 w-12 h-12 items-center justify-center rounded-full ${isRecording ? 'bg-red-600' : 'bg-green-500'}`}
          >
            <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
              <Feather name="mic" size={20} color="#fff" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
