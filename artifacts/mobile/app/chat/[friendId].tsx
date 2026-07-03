import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  fetchChatHistory,
  fetchFriends,
  sendMessage,
  uploadChatImage,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { safeParseJson } from '@/lib/utils';
import {
  Avatar,
  EmptyState,
  Field,
  IconButton,
  LoadingState,
  PlainScreen,
  Poster,
  palette,
} from '@/components/ui';

type SuggestionPayload = {
  type?: 'suggestion' | 'image';
  title?: string;
  coverImageBase64?: string | null;
  coverImageUrl?: string | null;
  imageUrl?: string;
  rating?: number | null;
  mediaType?: string;
};

export default function ChatScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: fetchFriends,
  });
  const messagesQuery = useQuery({
    queryKey: ['chat', friendId],
    queryFn: () => fetchChatHistory(friendId),
    enabled: Boolean(friendId),
    refetchInterval: 4000,
  });

  const friend = useMemo(
    () => friendsQuery.data?.friends.find((item) => item.id === friendId),
    [friendId, friendsQuery.data?.friends],
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['chat', friendId] });
    queryClient.invalidateQueries({ queryKey: ['friends'] });
  };

  const send = useMutation({
    mutationFn: (content: string) => sendMessage(friendId, content),
    onSuccess: () => {
      setText('');
      refresh();
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const uploaded = await uploadChatImage({
      uri: asset.uri,
      name: asset.fileName || 'chat-image.jpg',
      type: asset.mimeType || 'image/jpeg',
    });
    send.mutate(JSON.stringify({ type: 'image', imageUrl: uploaded.imageUrl }));
  };

  const messages = messagesQuery.data ?? [];
  const title = friend?.profile?.displayName || friend?.username || 'Chat';

  return (
    <PlainScreen>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />
          <Avatar uri={friend?.profile?.avatarUrl} name={title} />
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.subtitle}>@{friend?.username || 'kino'}</Text>
          </View>
        </View>

        {messagesQuery.isLoading ? (
          <LoadingState label="Loading messages" />
        ) : messages.length === 0 ? (
          <EmptyState icon="message-circle" title="No messages yet" body="Send a note or share a recommendation." />
        ) : (
          <ScrollView
            style={styles.messages}
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => {
              const mine = message.senderId === auth.user?.id;
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    mine ? styles.messageRowMine : styles.messageRowTheirs,
                  ]}
                >
                  <MessageBubble content={message.content} mine={mine} />
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.composer}>
          <Pressable onPress={pickImage} style={styles.imageButton}>
            <Feather name="image" size={18} color={palette.foreground} />
          </Pressable>
          <Field
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message"
            returnKeyType="send"
            onSubmitEditing={() => text.trim() && send.mutate(text.trim())}
          />
          <Pressable
            onPress={() => text.trim() && send.mutate(text.trim())}
            disabled={!text.trim() || send.isPending}
            style={[styles.sendButton, (!text.trim() || send.isPending) && styles.disabled]}
          >
            <Feather name="send" size={18} color={palette.primaryForeground} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </PlainScreen>
  );
}

function MessageBubble({ content, mine }: { content: string; mine: boolean }) {
  const payload = safeParseJson<SuggestionPayload | null>(content, null);

  if (payload?.type === 'suggestion') {
    return (
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, styles.suggestion]}>
        <Poster
          uri={payload.coverImageUrl || payload.coverImageBase64}
          title={payload.title || 'Suggestion'}
          style={styles.suggestionPoster}
        />
        <View style={styles.suggestionText}>
          <Text style={styles.suggestionLabel}>Recommendation</Text>
          <Text style={styles.suggestionTitle} numberOfLines={2}>{payload.title}</Text>
          <Text style={styles.suggestionMeta}>
            {payload.mediaType || 'title'}{payload.rating ? ` - ${payload.rating}/10` : ''}
          </Text>
        </View>
      </View>
    );
  }

  if (payload?.type === 'image' && payload.imageUrl) {
    return (
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, styles.imageBubble]}>
        <Poster uri={payload.imageUrl} title="Shared image" style={styles.chatImage} />
      </View>
    );
  }

  return (
    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
      <Text style={[styles.messageText, mine && styles.messageTextMine]}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: palette.foreground,
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    color: palette.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  messages: {
    flex: 1,
  },
  messageContent: {
    padding: 14,
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleMine: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  bubbleTheirs: {
    backgroundColor: palette.card,
    borderColor: palette.border,
  },
  messageText: {
    color: palette.foreground,
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextMine: {
    color: palette.primaryForeground,
  },
  suggestion: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: palette.card,
    borderColor: palette.border,
  },
  suggestionPoster: {
    width: 58,
    height: 84,
    aspectRatio: undefined,
  },
  suggestionText: {
    flex: 1,
    justifyContent: 'center',
  },
  suggestionLabel: {
    color: palette.primary,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  suggestionTitle: {
    color: palette.foreground,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  suggestionMeta: {
    color: palette.mutedForeground,
    fontSize: 12,
    marginTop: 4,
  },
  imageBubble: {
    padding: 4,
    backgroundColor: palette.card,
  },
  chatImage: {
    width: 210,
    height: 240,
    aspectRatio: undefined,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  imageButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: palette.secondary,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});
