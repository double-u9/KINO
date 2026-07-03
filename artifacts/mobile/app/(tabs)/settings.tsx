import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchOwnProfile, updatePrivacy } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { PrivacySettings } from '@/lib/types';
import {
  Button,
  Card,
  Header,
  LoadingState,
  Screen,
  SegmentedControl,
  ToggleRow,
  palette,
} from '@/components/ui';

type Visibility = 'public' | 'friends' | 'private';

const VISIBILITY: Array<{ value: Visibility; label: string }> = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'private', label: 'Private' },
];

const DEFAULT_PRIVACY: PrivacySettings = {
  profileVisibility: 'public',
  showWatchHistory: true,
  showFavorites: true,
  showActivity: true,
  allowFriendRequests: true,
};

export default function SettingsScreen() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [privacy, setPrivacy] = useState<PrivacySettings>(DEFAULT_PRIVACY);

  const profileQuery = useQuery({
    queryKey: ['own-profile'],
    queryFn: fetchOwnProfile,
  });

  useEffect(() => {
    const next = profileQuery.data?.profile?.privacy;
    if (next) setPrivacy({ ...DEFAULT_PRIVACY, ...next });
  }, [profileQuery.data]);

  const save = useMutation({
    mutationFn: () => updatePrivacy(privacy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['own-profile'] }),
  });

  const logout = async () => {
    await auth.logout();
    router.replace('/(auth)/login');
  };

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading settings" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Settings" subtitle="Account, privacy, and session controls." />

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <InfoRow label="Username" value={`@${auth.user?.username || ''}`} />
        <InfoRow label="Email" value={auth.user?.email || ''} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <Text style={styles.label}>Profile Visibility</Text>
        <SegmentedControl
          value={privacy.profileVisibility as Visibility}
          options={VISIBILITY}
          onChange={(value) => setPrivacy((current) => ({ ...current, profileVisibility: value }))}
          compact
        />
        <ToggleRow
          icon="eye"
          title="Show watch history"
          subtitle="Friends can see what you have watched."
          value={privacy.showWatchHistory}
          onValueChange={(value) => setPrivacy((current) => ({ ...current, showWatchHistory: value }))}
        />
        <ToggleRow
          icon="star"
          title="Show favorites"
          subtitle="Feature starred titles on your profile."
          value={privacy.showFavorites}
          onValueChange={(value) => setPrivacy((current) => ({ ...current, showFavorites: value }))}
        />
        <ToggleRow
          icon="rss"
          title="Show activity"
          subtitle="Allow your updates to appear in friend feeds."
          value={privacy.showActivity}
          onValueChange={(value) => setPrivacy((current) => ({ ...current, showActivity: value }))}
        />
        <ToggleRow
          icon="user-plus"
          title="Allow friend requests"
          subtitle="Let other users send connection requests."
          value={privacy.allowFriendRequests}
          onValueChange={(value) => setPrivacy((current) => ({ ...current, allowFriendRequests: value }))}
        />
        <Button
          label="Save Privacy Settings"
          icon="save"
          onPress={() => save.mutate()}
          loading={save.isPending}
        />
      </Card>

      <Button
        label="Sign Out"
        icon="log-out"
        variant="danger"
        onPress={logout}
      />
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  sectionTitle: {
    color: palette.foreground,
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  label: {
    color: palette.mutedForeground,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    color: palette.mutedForeground,
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    color: palette.foreground,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    textAlign: 'right',
  },
});
