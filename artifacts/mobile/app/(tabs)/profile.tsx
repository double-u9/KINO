import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import {
  fetchMedia,
  fetchOwnProfile,
  removeAvatar,
  removeBanner,
  updateProfile,
  uploadAvatar,
  uploadBanner,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getCoverImage } from '@/lib/types';
import { resolveAssetUrl } from '@/lib/utils';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Field,
  Header,
  Poster,
  Screen,
  TextArea,
  palette,
} from '@/components/ui';

const THEME_COLORS = [
  '#F5C518',
  '#2D6CDF',
  '#22C55E',
  '#EC4899',
  '#F97316',
  '#8B5CF6',
  '#06B6D4',
  '#EF4444',
];

export default function ProfileScreen() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [themeColor, setThemeColor] = useState('#F5C518');

  const profileQuery = useQuery({
    queryKey: ['own-profile'],
    queryFn: fetchOwnProfile,
  });
  const mediaQuery = useQuery({
    queryKey: ['media'],
    queryFn: async () => (await fetchMedia()).media,
  });

  const profile = profileQuery.data?.profile;
  const profileRecord = profile?.profile;
  const display = profileRecord?.displayName || auth.user?.username || 'Kino user';
  const avatarUrl = resolveAssetUrl(profileRecord?.avatarUrl);
  const bannerUrl = resolveAssetUrl(profileRecord?.bannerUrl);
  const favorites = (mediaQuery.data ?? []).filter((item) => item.isFavorite);
  const media = mediaQuery.data ?? [];

  useEffect(() => {
    if (!profileRecord) return;
    setDisplayName(profileRecord.displayName || '');
    setBio(profileRecord.bio || '');
    setThemeColor(profileRecord.themeColor || '#F5C518');
  }, [profileRecord]);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['own-profile'] }),
      queryClient.invalidateQueries({ queryKey: ['media'] }),
    ]);
    await auth.refreshUser().catch(() => undefined);
  };

  const save = useMutation({
    mutationFn: () => updateProfile({ displayName, bio, themeColor }),
    onSuccess: async () => {
      setEditing(false);
      await refresh();
    },
  });

  const pickImage = async (kind: 'avatar' | 'banner') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const file = {
      uri: asset.uri,
      name: asset.fileName || `${kind}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    };

    if (kind === 'avatar') await uploadAvatar(file);
    else await uploadBanner(file);
    await refresh();
  };

  const removeImage = async (kind: 'avatar' | 'banner') => {
    if (kind === 'avatar') await removeAvatar();
    else await removeBanner();
    await refresh();
  };

  return (
    <Screen>
      <Header title="Profile" subtitle={`@${auth.user?.username || ''}`} />

      <Card style={[styles.hero, { borderColor: `${themeColor}55` }]}>
        <Pressable onPress={() => pickImage('banner')} style={styles.banner}>
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[styles.bannerEmpty, { backgroundColor: `${themeColor}22` }]}>
              <Feather name="image" size={28} color={themeColor} />
            </View>
          )}
        </Pressable>

        <View style={styles.profileRow}>
          <Pressable onPress={() => pickImage('avatar')}>
            <Avatar uri={avatarUrl} name={display} size={86} />
          </Pressable>
          <View style={styles.profileInfo}>
            <Text style={styles.displayName} numberOfLines={1}>{display}</Text>
            <Text style={styles.username}>@{auth.user?.username}</Text>
            <View style={styles.profileActions}>
              <Button
                label={editing ? 'Cancel' : 'Edit'}
                icon={editing ? 'x' : 'edit-2'}
                variant="secondary"
                onPress={() => setEditing((value) => !value)}
                style={styles.smallButton}
              />
            </View>
          </View>
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <Field label="Display name" value={displayName} onChangeText={setDisplayName} />
            <TextArea label="Bio" value={bio} onChangeText={setBio} maxLength={500} />
            <Text style={styles.colorLabel}>Accent Color</Text>
            <View style={styles.swatches}>
              {THEME_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setThemeColor(color)}
                  style={[
                    styles.swatch,
                    { backgroundColor: color },
                    themeColor === color && styles.swatchActive,
                  ]}
                />
              ))}
            </View>
            <Button
              label="Save Profile"
              icon="save"
              onPress={() => save.mutate()}
              loading={save.isPending}
            />
            <View style={styles.removeRow}>
              {avatarUrl ? (
                <Button label="Remove Avatar" icon="user-x" variant="secondary" onPress={() => removeImage('avatar')} style={styles.removeButton} />
              ) : null}
              {bannerUrl ? (
                <Button label="Remove Banner" icon="image" variant="secondary" onPress={() => removeImage('banner')} style={styles.removeButton} />
              ) : null}
            </View>
          </View>
        ) : bio ? (
          <Text style={styles.bio}>{bio}</Text>
        ) : (
          <Text style={styles.emptyBio}>No bio yet</Text>
        )}
      </Card>

      <View style={styles.stats}>
        <Stat label="Titles" value={media.length} icon="film" color={themeColor} />
        <Stat label="Friends" value={profile?.friendCount ?? 0} icon="users" color={palette.accent} />
        <Stat label="Stars" value={favorites.length} icon="star" color={palette.primary} />
      </View>

      <Text style={styles.sectionTitle}>Favorites</Text>
      {favorites.length === 0 ? (
        <EmptyState icon="star" title="No favorites yet" body="Star titles in your vault to feature them here." />
      ) : (
        <View style={styles.favorites}>
          {favorites.slice(0, 8).map((item) => (
            <View key={item.id} style={styles.favoriteItem}>
              <Poster uri={getCoverImage(item)} title={item.title} />
              <Text style={styles.favoriteTitle} numberOfLines={2}>{item.title}</Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Stat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Feather>['name'];
  color: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Feather name={icon} size={18} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
    padding: 0,
  },
  banner: {
    height: 150,
    backgroundColor: palette.poster,
  },
  bannerEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 14,
    marginTop: -34,
    alignItems: 'flex-end',
  },
  profileInfo: {
    flex: 1,
    paddingBottom: 4,
  },
  displayName: {
    color: palette.foreground,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  username: {
    color: palette.mutedForeground,
    fontSize: 13,
    marginTop: 2,
  },
  profileActions: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  smallButton: {
    minHeight: 38,
  },
  editForm: {
    padding: 14,
    gap: 12,
  },
  colorLabel: {
    color: palette.mutedForeground,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: palette.foreground,
  },
  removeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  removeButton: {
    flex: 1,
  },
  bio: {
    color: palette.foreground,
    fontSize: 14,
    lineHeight: 21,
    padding: 14,
  },
  emptyBio: {
    color: palette.mutedForeground,
    fontStyle: 'italic',
    padding: 14,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: palette.foreground,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    color: palette.mutedForeground,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: palette.foreground,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  favorites: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  favoriteItem: {
    width: '30.8%',
    gap: 6,
  },
  favoriteTitle: {
    color: palette.foreground,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
