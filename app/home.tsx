import { useState } from 'react';
import { View, Pressable, Text, Dimensions, TextInput } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import MainHeader from '@/src/components/layout/MainHeader';
import SideMenu from '@/src/components/layout/SideMenu';
import ChatList from '@/src/components/chat/ChatList';
import { StatusBar } from 'expo-status-bar';
import { useUserChats } from '@/src/hooks/queries/useUserChats';
import { useAuth } from '@/src/hooks/useAuth';

const { width } = Dimensions.get('window');
const TAB_CONTAINER_WIDTH = width - 32; 
const TAB_WIDTH = TAB_CONTAINER_WIDTH / 2;

const AnimatedSquishCreate = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.9, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
        className="w-11 h-11 bg-primary dark:bg-primary-dark rounded-xl justify-center items-center shadow-sm shadow-primary/30"
      >
        <Feather name="plus" size={22} color="#ffffff" />
      </Pressable>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();
  const { data: userChats = [] } = useUserChats();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'privados' | 'workspaces'>('privados');
  const [searchTerm, setSearchTerm] = useState(''); 

  const hasUnreadPrivados = userChats.some(c => !c.workspaceId && (c.unreadCounts?.[user?._id || ''] || 0) > 0);
  const hasUnreadWorkspaces = userChats.some(c => !!c.workspaceId && (c.unreadCounts?.[user?._id || ''] || 0) > 0);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withSpring(activeTab === 'privados' ? 0 : TAB_WIDTH - 8, { damping: 20, stiffness: 90 }) },
      ],
    };
  }, [activeTab]);

  // 🚀 Cero rebotes layout: usamos withTiming para evitar el overshoot y la deformación de la barra
  const createBtnContainerStyle = useAnimatedStyle(() => {
    const isWorkspaces = activeTab === 'workspaces';
    return {
      width: withTiming(isWorkspaces ? 44 : 0, { duration: 200 }),
      opacity: withTiming(isWorkspaces ? 1 : 0, { duration: 150 }),
      marginLeft: withTiming(isWorkspaces ? 12 : 0, { duration: 200 })
    };
  }, [activeTab]);

  const searchScale = useSharedValue(1);
  const searchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }]
  }));

  return (
    <View className="flex-1 bg-white dark:bg-authEnd-dark">
      <StatusBar style="light" />
      <View style={{ paddingTop: insets.top }} className="bg-primary dark:bg-primary-dark z-20">
        <MainHeader onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} />
        
        <View className="px-4 pb-4 pt-1 bg-white dark:bg-authEnd-dark z-10 border-b border-gray-100 dark:border-gray-800">
            
            <View className="flex-row bg-gray-100 dark:bg-zinc-800/80 rounded-xl p-1 relative mb-3">
                <Animated.View
                    style={[
                        { position: 'absolute', top: 4, bottom: 4, left: 4, width: TAB_WIDTH - 4, borderRadius: 8 },
                        indicatorStyle,
                    ]}
                    className="bg-white dark:bg-zinc-700 shadow-sm"
                />
                <Pressable className="flex-1 py-2.5 items-center justify-center z-10 relative" onPress={() => setActiveTab('privados')}>
                    <View className="flex-row items-center justify-center">
                        <Text className={`text-sm font-nunito-bold transition-colors ${activeTab === 'privados' ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Privados</Text>
                        {hasUnreadPrivados && <View className="w-2 h-2 rounded-full bg-orange-500 absolute -right-3 top-0 border border-white dark:border-zinc-800/80" />}
                    </View>
                </Pressable>
                <Pressable className="flex-1 py-2.5 items-center justify-center z-10 relative" onPress={() => setActiveTab('workspaces')}>
                    <View className="flex-row items-center justify-center">
                        <Text className={`text-sm font-nunito-bold transition-colors ${activeTab === 'workspaces' ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Workspaces</Text>
                        {hasUnreadWorkspaces && <View className="w-2 h-2 rounded-full bg-orange-500 absolute -right-3 top-0 border border-white dark:border-zinc-800/80" />}
                    </View>
                </Pressable>
            </View>

            <View className="flex-row items-center">
              <Animated.View style={[searchAnimatedStyle, { flex: 1, flexDirection: 'row', alignItems: 'center' }]} className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 h-11 overflow-hidden">
                <Feather name="search" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF'} />
                <TextInput 
                  className="flex-1 ml-2 text-base font-nunito-regular text-textMain dark:text-textMain-dark"
                  placeholder="Buscar en tus chats..."
                  placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  autoCapitalize="none"
                  onFocus={() => { searchScale.value = withSpring(1.02, { damping: 12 }); }}
                  onBlur={() => { searchScale.value = withSpring(1); }}
                />
                {searchTerm.length > 0 && (
                  <Pressable onPress={() => setSearchTerm('')} className="p-1">
                    <Feather name="x-circle" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF'} />
                  </Pressable>
                )}
              </Animated.View>

              <Animated.View style={createBtnContainerStyle} className="overflow-hidden">
                <AnimatedSquishCreate onPress={() => router.push('/workspace/create')} />
              </Animated.View>
            </View>

        </View>
      </View>

      <View className="flex-1 relative">
        {isMenuOpen && (
            <Pressable 
                className="absolute inset-0 z-40 bg-black/10 dark:bg-black/40" 
                onPress={() => setIsMenuOpen(false)} 
            />
        )}
        {isMenuOpen && <SideMenu />}
        
        <ChatList activeTab={activeTab} searchTerm={searchTerm} />
      </View>
    </View>
  );
}