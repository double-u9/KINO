import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  fetchNotifications,
  markAllRead,
  markNotificationRead,
} from '@/lib/api';
import type { NotificationItem } from '@/lib/types';
import { formatRelativeTime, safeParseJson } from '@/lib/utils';
import {
  Button,
  Card,
  EmptyState,
  Header,
  LoadingState,
  Screen,
  palette,
} from '@/components/ui';

const TYPE_ICON: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  friend_request: 'user-plus',
  friend_accepted: 'user-check',
  new_message: 'message-circle',
  activity: 'rss',
  system: 'info',
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const clearAll = useMutation({ mutationFn: markAllRead, onSuccess: refresh });
  const notifications = notificationsQuery.data?.notifications ?? [];
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <Screen>
      <Header
        title="Alerts"
        subtitle={unread ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'You are all caught up.'}
        right={
          unread ? (
            <Button
              label="Clear"
              icon="check"
              variant="secondary"
              loading={clearAll.isPending}
              onPress={() => clearAll.mutate()}
            />
          ) : null
        }
      />

      {notificationsQuery.isLoading ? (
        <LoadingState label="Loading alerts" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="bell"
          title="No alerts"
          body="Friend requests, accepted connections, and messages will appear here."
        />
      ) : (
        <View style={styles.list}>
          {notifications.map((item) => (
            <NotificationCard key={item.id} item={item} onChanged={refresh} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function NotificationCard({
  item,
  onChanged,
}: {
  item: NotificationItem;
  onChanged: () => void;
}) {
  const readMutation = useMutation({
    mutationFn: () => markNotificationRead(item.id),
    onSuccess: onChanged,
  });
  const icon = TYPE_ICON[item.type] || 'bell';

  const open = () => {
    if (!item.read) readMutation.mutate();
    if (item.type === 'friend_request') router.push('/(tabs)/friends?tab=requests');
    if (item.type === 'new_message') {
      const payload = safeParseJson<{ senderId?: string }>(item.payload, {});
      if (payload.senderId) router.push(`/chat/${payload.senderId}`);
    }
  };

  return (
    <Pressable onPress={open} style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={[styles.card, !item.read && styles.unreadCard]}>
        <View style={[styles.iconWrap, !item.read && styles.iconUnread]}>
          <Feather name={icon} size={18} color={item.read ? palette.mutedForeground : palette.primary} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {item.body ? <Text style={styles.bodyText} numberOfLines={2}>{item.body}</Text> : null}
          <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        {!item.read ? <View style={styles.dot} /> : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  pressed: {
    opacity: 0.78,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  unreadCard: {
    borderColor: '#f5c51855',
    backgroundColor: '#15130a',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.secondary,
  },
  iconUnread: {
    backgroundColor: '#30270d',
  },
  body: {
    flex: 1,
  },
  title: {
    color: palette.foreground,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  bodyText: {
    color: palette.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  time: {
    color: palette.mutedForeground,
    fontSize: 11,
    marginTop: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: palette.primary,
    marginTop: 4,
  },
});
