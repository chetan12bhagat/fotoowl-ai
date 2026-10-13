import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MemoryPerson } from '../types/memory';
import { useTheme } from '../hooks/useTheme';

interface AllPeopleModalProps {
  visible: boolean;
  onClose: () => void;
  people: MemoryPerson[];
  onSelectPerson: (person: MemoryPerson) => void;
}

export const AllPeopleModal: React.FC<AllPeopleModalProps> = ({
  visible,
  onClose,
  people,
  onSelectPerson,
}) => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');

  const filteredPeople = useMemo(() => {
    if (!search.trim()) return people;
    const q = search.toLowerCase().trim();
    return people.filter(
      (p) => p.name.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q)
    );
  }, [people, search]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#071421' : '#FFFFFF' }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDark ? '#1C2F45' : '#E4E7EC',
              paddingTop: Platform.OS === 'ios' ? 50 : 20,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#101828'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
            All People ({people.length})
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: isDark ? '#0B1C2A' : '#F8FAFC',
                borderColor: isDark ? '#1C2F45' : '#E4E7EC',
              },
            ]}
          >
            <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search people by name or relationship..."
              placeholderTextColor={isDark ? '#64748B' : '#98A2B3'}
              style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#101828' }]}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List of People */}
        <FlatList
          data={filteredPeople}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                onClose();
                onSelectPerson(item);
              }}
              style={[
                styles.personCard,
                {
                  backgroundColor: isDark ? '#0B1C2A' : '#FFFFFF',
                  borderColor: isDark ? '#1C2F45' : '#F2F4F7',
                },
              ]}
              activeOpacity={0.75}
            >
              <View style={styles.avatarWrapper}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.fallbackAvatar}>
                    <Text style={styles.fallbackAvatarText}>
                      {item.initials || item.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.personInfo}>
                <Text style={[styles.personName, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                  {item.name}
                </Text>
                {item.role ? (
                  <Text style={[styles.personRole, { color: isDark ? '#94A3B8' : '#667085' }]}>
                    {item.role}
                  </Text>
                ) : null}
              </View>

              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#94A3B8" />
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
                No People Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#667085' }]}>
                {search ? `No people match "${search}".` : 'No people tagged in your memories.'}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E4E7EC',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  fallbackAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071421',
  },
  personInfo: {
    flex: 1,
    marginLeft: 14,
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
  },
  personRole: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
