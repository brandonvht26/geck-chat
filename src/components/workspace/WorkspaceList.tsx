import { View, StyleSheet, FlatList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import WorkspaceCard from './WorkspaceCard';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  membersCount: number;
}

const mockWorkspaces: Workspace[] = [
  {
    id: '1',
    name: 'Tesis UI',
    description: 'Diseño de pantallas y componentes',
    membersCount: 3,
  },
  {
    id: '2',
    name: 'Backend API',
    description: 'Desarrollo del servidor y endpoints',
    membersCount: 2,
  },
  {
    id: '3',
    name: 'Documentación',
    description: 'Manuales y guías técnicas',
    membersCount: 1,
  },
];

export default function WorkspaceList() {
  const router = useRouter();

  const renderItem = ({ item }: { item: Workspace }) => (
    <WorkspaceCard
      name={item.name}
      description={item.description}
      membersCount={item.membersCount}
      onPress={() => router.push({ pathname: '/workspace/[id]', params: { id: item.id, name: item.name } })}
    />
  );

  return (
    <FlatList
      data={mockWorkspaces}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
});