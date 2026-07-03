import { Feather } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { palette } from '@/components/ui';
import { useAuth } from '@/lib/auth';

const TAB_ICON: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  index: 'grid',
  feed: 'rss',
  friends: 'users',
  notifications: 'bell',
  profile: 'user',
  settings: 'settings',
};

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.mutedForeground,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        sceneStyle: { backgroundColor: palette.background },
        tabBarIcon: ({ color, size }) => (
          <Feather name={TAB_ICON[route.name] || 'circle'} size={size - 2} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Vault' }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
  tabBar: {
    position: 'absolute',
    minHeight: 74,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopColor: palette.border,
    backgroundColor: '#0d0d10',
  },
  tabItem: {
    paddingVertical: 2,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
});
