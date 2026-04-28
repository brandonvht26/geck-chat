import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface WorkspaceCardProps {
  name: string;
  description: string;
  membersCount: number;
}

export default function WorkspaceCard({ name, description, membersCount }: WorkspaceCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="layers" size={20} color="#007AFF" />
        <Text style={styles.name}>{name}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.footer}>
        <View style={styles.membersBadge}>
          <Feather name="users" size={14} color="#666" />
          <Text style={styles.membersCount}>{membersCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
});