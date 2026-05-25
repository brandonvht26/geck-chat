import { View, TextInput, Pressable, Text, Platform } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming, useEffect } from 'react-native-reanimated';

interface ChatInputProps {
  content: string;
  setContent: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  isRecording?: boolean;
  onStartRecord?: () => void;
  onStopRecord?: () => void; // Funcionará como "Enviar"
  onCancelRecord?: () => void; // 🚀 Nueva prop para el botón de basura
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

const AnimatedSquishBtn = ({ onPress, onLongPress, disabled, children, className }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    return (
      <Reanimated.View style={animatedStyle}>
        <Pressable
          onPressIn={() => { scale.value = withSpring(0.85, { damping: 15 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
          onPress={onPress}
          onLongPress={onLongPress}
          disabled={disabled}
          className={className}
        >
          {children}
        </Pressable>
      </Reanimated.View>
    );
};

// 🚀 Animación de parpadeo rojo para "Grabando..."
const PulsingMic = () => {
    const opacity = useSharedValue(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    opacity.value = withRepeat(withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true);
    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
    
    return (
        <Reanimated.View style={style} className="flex-row items-center flex-1 justify-center">
            <View className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2" />
            <Text className="text-red-500 font-snpro-bold text-base">Grabando...</Text>
        </Reanimated.View>
    );
}

export default function ChatInput({
  content, setContent, onSend, onAttach, isRecording, onStartRecord, onStopRecord, onCancelRecord, isEditing, onCancelEdit
}: ChatInputProps) {
  const hasContent = content.trim().length > 0;
  const { colorScheme } = useColorScheme();

  return (
    <View className={`flex-row items-end px-3 py-2 ${Platform.OS === 'ios' ? 'mb-2' : 'mb-0'} bg-transparent w-full`}>
      
      {isRecording ? (
        // 🚀 NUEVA INTERFAZ DE GRABACIÓN ACTIVA
        <View className="flex-1 flex-row items-center bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-full h-12 shadow-sm px-2 justify-between">
            {/* Botón Cancelar (Basurero) */}
            <Pressable onPress={onCancelRecord} className="p-2 bg-red-50 dark:bg-red-900/30 rounded-full border border-red-100 dark:border-red-900/50">
                <Feather name="trash-2" size={20} color="#EF4444" />
            </Pressable>

            {/* Indicador */}
            <PulsingMic />

            {/* Botón Enviar Audio */}
            <AnimatedSquishBtn onPress={onStopRecord} className="w-10 h-10 items-center justify-center rounded-full bg-primary dark:bg-primary-dark shadow-sm shadow-primary/30">
                <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 2 }} />
            </AnimatedSquishBtn>
        </View>

      ) : (
        // INTERFAZ DE TEXTO NORMAL
        <>
          <View className="flex-1 flex-row items-end bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl pl-2 pr-1 py-1 shadow-sm">
            <Pressable onPress={onAttach} className="p-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full mr-1">
              <Feather name="paperclip" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </Pressable>

            <TextInput
              className="flex-1 min-h-[40px] max-h-[100px] text-base font-nunito-regular text-textMain dark:text-textMain-dark px-2 pb-2.5 pt-3"
              value={content}
              onChangeText={setContent}
              placeholder={isEditing ? 'Editando mensaje...' : 'Mensaje...'}
              placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
              multiline
            />

            {isEditing && onCancelEdit && (
              <Pressable onPress={onCancelEdit} className="p-2 mr-1">
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          <View className="ml-2 mb-1.5">
            {hasContent || isEditing ? (
              <AnimatedSquishBtn
                onPress={onSend}
                disabled={!hasContent}
                className={`w-12 h-12 items-center justify-center rounded-full shadow-sm ${!hasContent ? 'bg-gray-300 dark:bg-zinc-700' : 'bg-primary dark:bg-primary-dark shadow-primary/30'}`}
              >
                <Ionicons name={isEditing ? 'checkmark' : 'send'} size={20} color="#fff" style={{ marginLeft: isEditing ? 0 : 2 }} />
              </AnimatedSquishBtn>
            ) : (
              <AnimatedSquishBtn
                onPress={onStartRecord} // 🚀 Ahora con un TAP activas la grabación
                className="w-12 h-12 items-center justify-center rounded-full bg-primary dark:bg-primary-dark shadow-sm shadow-primary/30"
              >
                <Ionicons name="mic" size={22} color="#fff" />
              </AnimatedSquishBtn>
            )}
          </View>
        </>
      )}
    </View>
  );
}