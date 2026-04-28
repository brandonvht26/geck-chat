import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MainHeader from '@/src/components/layout/MainHeader';
import SideMenu from '@/src/components/layout/SideMenu';
import ChatList from '@/src/components/chat/ChatList';

export default function HomeScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <MainHeader onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} />
        {isMenuOpen && <SideMenu />}
      </View>
      <ChatList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    paddingTop: 44,
  },
});