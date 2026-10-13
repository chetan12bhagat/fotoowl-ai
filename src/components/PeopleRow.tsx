import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MemoryPerson } from '../types/memory';
import { useTheme } from '../hooks/useTheme';

interface PeopleRowProps {
  people: MemoryPerson[];
  onSelectPerson: (person: MemoryPerson) => void;
  onViewAll: () => void;
}

export const PeopleRow: React.FC<PeopleRowProps> = ({
  people,
  onSelectPerson,
  onViewAll,
}) => {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#101828' }]}>
            People
          </Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#94A3B8' : '#667085' }]}>
            Moments with friends & family
          </Text>
        </View>

        <TouchableOpacity
          onPress={onViewAll}
          style={styles.viewAllBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="View All People"
        >
          <Text style={[styles.viewAllText, { color: '#FFB900' }]}>View All</Text>
          <Ionicons name="chevron-forward" size={15} color="#FFB900" />
        </TouchableOpacity>
      </View>

      {/* Horizontal Scrollable Row of Circular Avatars */}
      {people.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={28} color="#94A3B8" />
          <Text style={[styles.emptyText, { color: isDark ? '#94A3B8' : '#667085' }]}>
            No people tagged in your memories yet.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          {people.map((person) => (
            <TouchableOpacity
              key={person.id}
              onPress={() => onSelectPerson(person)}
              activeOpacity={0.8}
              style={styles.personItem}
              accessibilityRole="button"
              accessibilityLabel={`${person.name}, ${person.role || 'Member'}`}
            >
              <View
                style={[
                  styles.avatarRing,
                  {
                    borderColor: isDark ? '#1C2F45' : '#E4E7EC',
                    backgroundColor: isDark ? '#0B1C2A' : '#F2F4F7',
                  },
                ]}
              >
                {person.avatarUrl ? (
                  <Image source={{ uri: person.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.fallbackInitials}>
                      {person.initials || person.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[styles.personName, { color: isDark ? '#FFFFFF' : '#101828' }]}
                numberOfLines={1}
              >
                {person.name.split(' ')[0]}
              </Text>

              {person.role ? (
                <Text
                  style={[styles.personRole, { color: isDark ? '#94A3B8' : '#667085' }]}
                  numberOfLines={1}
                >
                  {person.role}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  titleColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: 8,
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  personItem: {
    alignItems: 'center',
    width: 72,
  },
  avatarRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#FFB900',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#071421',
  },
  personName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  personRole: {
    fontSize: 11,
    marginTop: 1,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
});
