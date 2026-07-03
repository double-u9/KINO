import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import {
  fetchPublicProfile,
  fetchUserMedia,
  sendFriendRequest,
} from '@/lib/api';
import { getCoverImage } from '@/lib/types';
import { formatRelativeTime, resolveAssetUrl } from '@/lib/utils';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Header,
  IconButton,
  LoadingState,
  Poster,
  Screen,
  palette,
} from '@/components/ui';

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => fetchPublicProfile(username),
    enabled: Boolean(username),
  });
  const mediaQuery = useQuery({
    queryKey: ['public-profile-media', username],
    queryFn: () => fetchUserMedia(username),
    enabled: Boolean(username),
  });

  const profile = profileQuery.data?.profile;
  const media = mediaQuery.data?.media ?? [];
  const profileRecord = profile?.profile;
  const display = profileRecord?.displayName || profile?.username || username;
  const banner = resolveAssetUrl(profileRecord?.bannerUrl);
  const avatar = resolveAssetUrl(profileRecord?.avatarUrl);

  const addFriend = useMutation({
    mutationFn: () => sendFriendRequest(profile!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['public-profile', username] }),
  });

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading profile" />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <Header title="Profile" right={<IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />} />
        <EmptyState icon="user-x" title="Profile not found" body="This user is unavailable." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title={display}
        subtitle={`@${profile.username}`}
        right={<IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />}
      />

      <Card style={styles.hero}>
        <View style={styles.banner}>
          {banner ? (
            <Image source={{ uri: banner }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.bannerEmpty}>
              <Feather name="film" size={30} color={profileRecord?.themeColor || palette.primary} />
            </View>
          )}
        </View>
        <View style={styles.identity}>
          <Avatar uri={avatar} name={display} size={78} />
          <View style={styles.identityText}>
            <Text style={styles.displayName}>{display}</Text>
            <Text style={styles.meta}>Joined {formatRelativeTime(profile.createdAt)}</Text>
          </View>
        </View>
        {profileRecord?.bio ? <Text style={styles.bio}>{profileRecord.bio}</Text> : null}
        {!profile.isSelf && !profile.isFriend ? (
          <Button
            label="Send Friend Request"
            icon="user-plus"
            onPress={() => addFriend.mutate()}
            loading={addFriend.isPending}
          />
        ) : null}
      </Card>

      <View style={styles.stats}>
        <Stat label="Titles" value={profile.mediaCount} />
        <Stat label="Friends" value={profile.friendCount} />
      </View>

      <Text style={styles.sectionTitle}>Public Vault</Text>
      {mediaQuery.isLoading ? (
        <LoadingState label="Loading titles" />
      ) : media.length === 0 ? (
        <EmptyState icon="lock" title="Nothing to show" body="This profile has no public titles right now." />
      ) : (
        <View style={styles.grid}>
          {media.map((item) => (
            <View key={item.id} style={styles.mediaItem}>
              <Poster uri={getCoverImage(item)} title={item.title} />
              <Text style={styles.mediaTitle} numberOfLines={2}>{item.title}</Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 0,
    overflow: 'hidden',
    gap: 0,
  },
  banner: {
    height: 142,
    backgroundColor: palette.poster,
  },
  bannerEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151515',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    paddingHorizontal: 14,
    marginTop: -28,
  },
  identityText: {
    flex: 1,
    paddingBottom: 5,
  },
  displayName: {
    color: palette.foreground,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  meta: {
    color: palette.mutedForeground,
    fontSize: 12,
    marginTop: 3,
  },
  bio: {
    color: palette.foreground,
    fontSize: 14,
    lineHeight: 21,
    padding: 14,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: palette.foreground,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    color: palette.mutedForeground,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: palette.foreground,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mediaItem: {
    width: '30.8%',
    gap: 6,
  },
  mediaTitle: {
    color: palette.foreground,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
