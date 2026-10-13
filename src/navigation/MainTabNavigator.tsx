import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { GalleryScreen } from '../screens/Gallery/GalleryScreen';
import { FavoritesScreen } from '../screens/Favorites/FavoritesScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { useFavorites } from '../hooks/useFavorites';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const { isDark } = useTheme();
  const { favoritesCount } = useFavorites();
  const insets = useSafeAreaInsets();

  // Dynamic safe-area padding for mobile home indicators and system navigation
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 10);
  const tabHeight = 56 + bottomInset;

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFB900', // Gold icon and label for active tab
        tabBarInactiveTintColor: isDark ? '#94A3B8' : '#667085', // Muted gray styling
        tabBarStyle: {
          backgroundColor: isDark ? '#071421' : '#FFFFFF', // White background with subtle top border
          borderTopColor: isDark ? '#1C2F45' : '#E4E7EC',
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.25 : 0.05,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.1,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      {/* 1. Home Tab */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* 2. Gallery Tab (My Gallery) */}
      <Tab.Screen
        name="GalleryTab"
        component={GalleryScreen}
        options={{
          tabBarLabel: 'Gallery',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'images' : 'images-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* 3. Favorites Tab */}
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favorites',
          tabBarBadge: favoritesCount > 0 ? favoritesCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#FFB900', // Gold favorite count badge
            fontSize: 10,
            color: '#071421',
            fontWeight: '800',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            alignSelf: 'center',
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* 4. Profile Tab */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
