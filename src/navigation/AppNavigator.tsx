import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { ImageDetailsScreen } from '../screens/ImageDetails/ImageDetailsScreen';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, isDark } = useTheme();

  // Custom NavigationContainer theme matching FotoOwl brand
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.borderSubtle,
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <RootStack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ animation: 'fade' }}
          />
        ) : (
          <>
            <RootStack.Screen
              name="Main"
              component={MainTabNavigator}
            />
            <RootStack.Screen
              name="ImageDetails"
              component={ImageDetailsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
