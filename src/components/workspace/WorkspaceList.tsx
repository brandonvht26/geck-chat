import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import WorkspaceCard from './WorkspaceCard';
import { getWorkspaces, WorkspaceResponse } from '@/src/services/workspace.service';

export interface Workspace {
  _id: string;
  id: string;
  name: string;
  description: string;
  membersCount: number;
}

export default function WorkspaceList() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkspaces();
      setWorkspaces(
        data.map((item: WorkspaceResponse) => ({
          _id: item.id,
          id: item.id,
          name: item.name,
          description: item.description,
          membersCount: 0,
        }))
      );
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWorkspaces();
    }, [fetchWorkspaces])
  );

  const renderItem = ({ item }: { item: Workspace }) => (
    <WorkspaceCard
      name={item.name}
      description={item.description}
      membersCount={item.membersCount}
      onPress={() => router.push({ pathname: '/workspace/[id]', params: { id: item.id, name: item.name } })}
    />
  );

  if (loading) {
    return (
      <View style={[styles.listContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (workspaces.length === 0) {
    return (
      <View style={[styles.listContainer, styles.centered]}>
        <Text style={styles.emptyText}>No hay workspaces disponibles</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={workspaces}
      keyExtractor={(item) => item._id}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});