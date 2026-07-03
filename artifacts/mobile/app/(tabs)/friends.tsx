import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  acceptRequest,
  cancelRequest,
  declineRequest,
  fetchFriends,
  fetchRequests,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from '@/lib/api';
import type { FriendInfo, UserSearchResult } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  Header,
  LoadingState,
  Screen,
  SegmentedControl,
  palette,
} from '@/components/ui';

type Tab = 'friends' | 'requests' | 'search';

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'friends', label: 'Friends' },
  { value: 'requests', label: 'Requests' },
  { value: 'search', label: 'Find' },
];

export default function FriendsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('friends');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (params.tab === 'requests' || params.tab === 'search' || params.tab === 'friends') {
      setTab(params.tab);
    }
  }, [params.tab]);

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: fetchFriends,
    refetchInterval: 7000,
  });
  const requestsQuery = useQuery({
    queryKey: ['friend-requests'],
    queryFn: fetchRequests,
    refetchInterval: 7000,
  });
  const searchQuery = useQuery({
    queryKey: ['user-search', query],
    queryFn: () => searchUsers(query.trim()),
    enabled: tab === 'search' && query.trim().length >= 2,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    queryClient.invalidateQueries({ queryKey: ['user-search'] });
  };

  const friends = friendsQuery.data?.friends ?? [];
  const requests = requestsQuery.data ?? { received: [], sent: [] };
  const isLoading = friendsQuery.isLoading || requestsQuery.isLoading;

  const subtitle = useMemo(() => {
    if (requests.received.length) return `${requests.received.length} request${requests.received.length === 1 ? '' : 's'} waiting`;
    if (friends.length) return `${friends.length} friend${friends.length === 1 ? '' : 's'} connected`;
    return 'Connect, chat, and share recommendations.';
  }, [friends.length, requests.received.length]);

  return (
    <Screen>
      <Header title="Friends" subtitle={subtitle} />
      <SegmentedControl value={tab} options={TABS} onChange={setTab} />

      {tab === 'search' ? (
        <>
          <Field
            icon="search"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            placeholder="Search by username"
          />
          {query.trim().length < 2 ? (
            <EmptyState icon="search" title="Find people" body="Type at least two characters." />
          ) : searchQuery.isLoading ? (
            <LoadingState label="Searching" />
          ) : (
            <View style={styles.list}>
              {(searchQuery.data?.users ?? []).map((user) => (
                <SearchUserCard key={user.id} user={user} onChanged={refresh} />
              ))}
              {searchQuery.data?.users.length === 0 ? (
                <EmptyState icon="user-x" title="No users found" body="Try another username." />
              ) : null}
            </View>
          )}
        </>
      ) : isLoading ? (
        <LoadingState label="Loading friends" />
      ) : tab === 'requests' ? (
        <View style={styles.list}>
          {requests.received.map((request) => (
            <RequestCard
              key={request.id}
              id={request.id}
              user={request.sender}
              direction="received"
              onChanged={refresh}
            />
          ))}
          {requests.sent.map((request) => (
            <RequestCard
              key={request.id}
              id={request.id}
              user={request.receiver}
              direction="sent"
              onChanged={refresh}
            />
          ))}
          {requests.received.length === 0 && requests.sent.length === 0 ? (
            <EmptyState icon="check-circle" title="No pending requests" body="You are all caught up." />
          ) : null}
        </View>
      ) : (
        <View style={styles.list}>
          {friends.map((friend) => (
            <FriendCard key={friend.friendshipId} friend={friend} onChanged={refresh} />
          ))}
          {friends.length === 0 ? (
            <EmptyState
              icon="users"
              title="No friends yet"
              body="Search for people and start sharing recommendations."
              action={<Button label="Find People" icon="search" onPress={() => setTab('search')} />}
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function FriendCard({
  friend,
  onChanged,
}: {
  friend: FriendInfo;
  onChanged: () => void;
}) {
  const removeMutation = useMutation({
    mutationFn: () => removeFriend(friend.friendshipId),
    onSuccess: onChanged,
  });
  const displayName = friend.profile?.displayName || friend.username;

  return (
    <Card style={styles.personCard}>
      <Link href={`/user/${friend.username}`} asChild>
        <Pressable>
          <Avatar uri={friend.profile?.avatarUrl} name={displayName} />
        </Pressable>
      </Link>
      <Link href={`/chat/${friend.id}`} asChild>
        <Pressable style={styles.personBody}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <Text style={[styles.meta, friend.unreadCount > 0 && styles.unread]} numberOfLines={1}>
            {friend.latestMessage
              ? `${friend.latestMessage.isMine ? 'You: ' : ''}${previewMessage(friend.latestMessage.content)} - ${formatRelativeTime(friend.latestMessage.createdAt)}`
              : `@${friend.username}`}
          </Text>
        </Pressable>
      </Link>
      {friend.unreadCount ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{friend.unreadCount > 99 ? '99+' : friend.unreadCount}</Text>
        </View>
      ) : null}
      <Pressable
        onPress={() => removeMutation.mutate()}
        style={styles.smallAction}
      >
        {removeMutation.isPending ? (
          <Feather name="loader" size={16} color={palette.mutedForeground} />
        ) : (
          <Feather name="user-x" size={17} color={palette.destructive} />
        )}
      </Pressable>
    </Card>
  );
}

function RequestCard({
  id,
  user,
  direction,
  onChanged,
}: {
  id: string;
  user: {
    id: string;
    username: string;
    profile: {
      displayName?: string | null;
      avatarUrl?: string | null;
    } | null;
  };
  direction: 'received' | 'sent';
  onChanged: () => void;
}) {
  const accept = useMutation({ mutationFn: () => acceptRequest(id), onSuccess: onChanged });
  const decline = useMutation({ mutationFn: () => declineRequest(id), onSuccess: onChanged });
  const cancel = useMutation({ mutationFn: () => cancelRequest(id), onSuccess: onChanged });
  const displayName = user.profile?.displayName || user.username;

  return (
    <Card style={styles.requestCard}>
      <Avatar uri={user.profile?.avatarUrl} name={displayName} />
      <View style={styles.personBody}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.meta}>@{user.username}</Text>
      </View>
      {direction === 'received' ? (
        <View style={styles.actions}>
          <Button label="Accept" icon="check" onPress={() => accept.mutate()} loading={accept.isPending} style={styles.compactButton} />
          <Button label="Decline" variant="secondary" icon="x" onPress={() => decline.mutate()} loading={decline.isPending} style={styles.compactButton} />
        </View>
      ) : (
        <Button label="Cancel" variant="secondary" icon="x" onPress={() => cancel.mutate()} loading={cancel.isPending} style={styles.compactButton} />
      )}
    </Card>
  );
}

function SearchUserCard({
  user,
  onChanged,
}: {
  user: UserSearchResult;
  onChanged: () => void;
}) {
  const add = useMutation({ mutationFn: () => sendFriendRequest(user.id), onSuccess: onChanged });
  const accept = useMutation({
    mutationFn: () => acceptRequest(user.requestId!),
    onSuccess: onChanged,
  });
  const displayName = user.profile?.displayName || user.username;

  return (
    <Card style={styles.personCard}>
      <Link href={`/user/${user.username}`} asChild>
        <Pressable>
          <Avatar uri={user.profile?.avatarUrl} name={displayName} />
        </Pressable>
      </Link>
      <View style={styles.personBody}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.meta}>@{user.username} - {user.mediaCount} titles</Text>
      </View>
      {user.relationshipStatus === 'none' ? (
        <Button label="Add" icon="user-plus" onPress={() => add.mutate()} loading={add.isPending} style={styles.compactButton} />
      ) : user.relationshipStatus === 'pending_received' && user.requestId ? (
        <Button label="Accept" icon="check" onPress={() => accept.mutate()} loading={accept.isPending} style={styles.compactButton} />
      ) : (
        <Text style={styles.statusText}>
          {user.relationshipStatus === 'friends' ? 'Friends' : 'Pending'}
        </Text>
      )}
    </Card>
  );
}

function previewMessage(content: string) {
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === 'suggestion') return `Sent ${parsed.title || 'a suggestion'}`;
    if (parsed.type === 'image') return 'Sent an image';
  } catch {
    // Plain message.
  }
  return content;
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  personBody: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: palette.foreground,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  meta: {
    color: palette.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  unread: {
    color: palette.foreground,
    fontFamily: 'Inter_700Bold',
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: palette.accentForeground,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  smallAction: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: palette.secondary,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  compactButton: {
    minHeight: 38,
    paddingHorizontal: 12,
  },
  statusText: {
    color: palette.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
});
