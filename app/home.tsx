import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MainHeader from '@/src/components/layout/MainHeader';
import SideMenu from '@/src/components/layout/SideMenu';
import WorkspaceList from '@/src/components/workspace/WorkspaceList';

export default function HomeScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <MainHeader onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} />
        {isMenuOpen && <SideMenu />}
      </View>
      <WorkspaceList />
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