import { Feather } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fetchFeed } from '@/lib/api';
import { ActivityItem } from '@/lib/types';
import { formatRelativeTime, safeParseJson } from '@/lib/utils';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Header,
  LoadingState,
  Poster,
  Screen,
  palette,
} from '@/components/ui';

const ACTIVITY: Record<string, { icon: React.ComponentProps<typeof Feather>['name']; verb: string; color: string }> = {
  added_media: { icon: 'plus-circle', verb: 'added', color: palette.success },
  rated: { icon: 'star', verb: 'rated', color: palette.primary },
  favorited: { icon: 'star', verb: 'favorited', color: palette.primary },
  completed_season: { icon: 'check-circle', verb: 'completed a season of', color: palette.accent },
  joined: { icon: 'user-plus', verb: 'joined Kino', color: palette.mutedForeground },
  friended: { icon: 'users', verb: 'became friends with', color: '#ec4899' },
};

export default function FeedScreen() {
  const feedQuery = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => fetchFeed(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const activities = feedQuery.data?.pages.flatMap((page) => page.activities) ?? [];

  return (
    <Screen>
      <Header
        title="Activity"
        subtitle="Updates from your vault and friends."
      />

      {feedQuery.isLoading ? (
        <LoadingState label="Loading activity" />
      ) : activities.length === 0 ? (
        <EmptyState
          icon="rss"
          title="Your feed is empty"
          body="Add titles or connect with friends to bring this feed to life."
        />
      ) : (
        <View style={styles.list}>
          {activities.map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))}
          {feedQuery.hasNextPage ? (
            <Button
              label="Load More"
              icon="chevrons-down"
              variant="secondary"
              loading={feedQuery.isFetchingNextPage}
              onPress={() => feedQuery.fetchNextPage()}
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const config = ACTIVITY[item.type] || ACTIVITY.added_media;
  const payload = typeof item.payload === 'string'
    ? safeParseJson<Record<string, any>>(item.payload, {})
    : (item.payload || {}) as Record<string, any>;
  const displayName = item.user.profile?.displayName || item.user.username;

  return (
    <Card style={styles.card}>
      <Link href={`/user/${item.user.username}`} asChild>
        <Pressable>
          <Avatar
            uri={item.user.profile?.avatarUrl}
            name={displayName}
            size={44}
          />
        </Pressable>
      </Link>
      <View style={styles.body}>
        <Text style={styles.text}>
          <Text style={styles.strong}>{displayName}</Text>{' '}
          <Text style={styles.muted}>{config.verb}</Text>
          {payload.title ? <Text style={styles.strong}> {String(payload.title)}</Text> : null}
          {payload.friendUsername ? <Text style={styles.strong}> @{String(payload.friendUsername)}</Text> : null}
          {payload.rating != null ? <Text style={styles.rating}> {String(payload.rating)}/10</Text> : null}
        </Text>
        <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
      <View style={styles.side}>
        <Feather name={config.icon} size={18} color={config.color} />
        {payload.coverImageUrl ? (
          <Poster uri={String(payload.coverImageUrl)} title={String(payload.title || '')} style={styles.poster} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  text: {
    color: palette.foreground,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  strong: {
    fontFamily: 'Inter_700Bold',
    color: palette.foreground,
  },
  muted: {
    color: palette.mutedForeground,
  },
  rating: {
    color: palette.primary,
    fontFamily: 'Inter_700Bold',
  },
  time: {
    color: palette.mutedForeground,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  side: {
    alignItems: 'center',
    gap: 8,
  },
  poster: {
    width: 42,
    height: 60,
    aspectRatio: undefined,
  },
});
