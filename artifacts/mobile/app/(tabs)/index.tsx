import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  addSeason,
  createMedia,
  deleteMedia,
  fetchMedia,
  updateMedia,
  updateSeason,
} from '@/lib/api';
import {
  fetchMetadataFromSearchResult,
  MetadataSearchResult,
  searchMetadata,
} from '@/lib/metadata';
import type { MediaItem, MediaType } from '@/lib/types';
import { getCoverImage } from '@/lib/types';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Header,
  IconButton,
  LoadingState,
  Notice,
  Pill,
  Poster,
  Screen,
  SegmentedControl,
  TextArea,
  palette,
} from '@/components/ui';

type Filter = 'all' | 'favorites' | MediaType;
type Sort = 'recent' | 'rating' | 'alpha';

const TYPE_OPTIONS: Array<{ value: MediaType; label: string }> = [
  { value: 'movie', label: 'Movie' },
  { value: 'series', label: 'Series' },
  { value: 'anime', label: 'Anime' },
  { value: 'music', label: 'Music' },
];

const FILTER_OPTIONS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'favorites', label: 'Stars' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
  { value: 'anime', label: 'Anime' },
  { value: 'music', label: 'Music' },
];

const SORT_OPTIONS: Array<{ value: Sort; label: string }> = [
  { value: 'recent', label: 'Recent' },
  { value: 'rating', label: 'Rated' },
  { value: 'alpha', label: 'A-Z' },
];

export default function VaultScreen() {
  const queryClient = useQueryClient();
  const [quickTitle, setQuickTitle] = useState('');
  const [quickType, setQuickType] = useState<MediaType>('movie');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('recent');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MetadataSearchResult[] | null>(null);
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const mediaQuery = useQuery({
    queryKey: ['media'],
    queryFn: async () => (await fetchMedia()).media,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['media'] });

  const addMutation = useMutation({
    mutationFn: createMedia,
    onSuccess: refresh,
    onError: (err: any) => setError(err?.error?.message || 'Failed to add media.'),
  });

  const quickSearch = useMutation({
    mutationFn: () => searchMetadata(quickTitle, quickType),
    onSuccess: (items) => {
      const manual: MetadataSearchResult = {
        id: `manual-${quickType}-${quickTitle}`,
        source: 'manual',
        title: quickTitle.trim(),
        type: quickType,
        year: null,
        posterUrl: null,
        rating: null,
        notes: '',
        imdbId: null,
      };
      setResults([...items, manual]);
    },
    onError: () => setError('Search failed. Try again.'),
  });

  const media = mediaQuery.data ?? [];
  const filtered = useMemo(() => {
    let items = [...media];
    if (filter === 'favorites') items = items.filter((item) => item.isFavorite);
    else if (filter !== 'all') items = items.filter((item) => item.type === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((item) => item.title.toLowerCase().includes(q));
    }
    if (sort === 'rating') items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sort === 'alpha') items.sort((a, b) => a.title.localeCompare(b.title));
    else items.sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
    return items;
  }, [filter, media, search, sort]);

  const handleQuickAdd = async () => {
    if (!quickTitle.trim()) return;
    setError(null);
    quickSearch.mutate();
  };

  const selectResult = async (result: MetadataSearchResult) => {
    setError(null);
    const metadata = await fetchMetadataFromSearchResult(result);
    await addMutation.mutateAsync({
      title: metadata.title,
      type: result.type,
      coverImageUrl: metadata.coverImageUrl,
      rating: metadata.rating,
      imdbId: metadata.imdbId,
      notes: metadata.notes,
      isFavorite: false,
    });
    setQuickTitle('');
    setResults(null);
  };

  return (
    <Screen>
      <Header
        title="Vault"
        subtitle="Search, save, rate, and track what you are watching or listening to."
        right={<IconButton icon="refresh-cw" label="Refresh" onPress={refresh} />}
      />

      {error ? <Notice type="error" message={error} /> : null}

      <Card style={styles.quickCard}>
        <SegmentedControl value={quickType} options={TYPE_OPTIONS} onChange={setQuickType} compact />
        <View style={styles.quickRow}>
          <Field
            style={styles.quickField}
            icon="search"
            value={quickTitle}
            onChangeText={setQuickTitle}
            placeholder={`Search ${quickType}`}
            returnKeyType="search"
            onSubmitEditing={handleQuickAdd}
          />
          <IconButton icon="plus" label="Add" onPress={handleQuickAdd} active />
        </View>
      </Card>

      {mediaQuery.isLoading ? (
        <LoadingState label="Loading your vault" />
      ) : media.length === 0 ? (
        <EmptyState
          icon="film"
          title="Your vault is empty"
          body="Search above to add a movie, series, anime, or song."
        />
      ) : (
        <>
          <Field
            icon="search"
            value={search}
            onChangeText={setSearch}
            placeholder="Search your saved titles"
          />
          <SegmentedControl value={filter} options={FILTER_OPTIONS} onChange={setFilter} compact />
          <SegmentedControl value={sort} options={SORT_OPTIONS} onChange={setSort} compact />
          <View style={styles.grid}>
            {filtered.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onPress={() => setSelected(item)}
                onRefresh={refresh}
              />
            ))}
          </View>
          {filtered.length === 0 ? (
            <EmptyState icon="search" title="No matches" body="Try another search or filter." />
          ) : null}
        </>
      )}

      <ResultSheet
        visible={Boolean(results)}
        title={quickTitle}
        isLoading={quickSearch.isPending || addMutation.isPending}
        results={results ?? []}
        onClose={() => setResults(null)}
        onSelect={selectResult}
      />

      <EditMediaSheet
        item={selected}
        onClose={() => setSelected(null)}
        onRefresh={refresh}
      />
    </Screen>
  );
}

function MediaCard({
  item,
  onPress,
  onRefresh,
}: {
  item: MediaItem;
  onPress: () => void;
  onRefresh: () => void;
}) {
  const favoriteMutation = useMutation({
    mutationFn: () => updateMedia(item.id, { isFavorite: !item.isFavorite }),
    onSuccess: onRefresh,
  });
  const addSeasonMutation = useMutation({
    mutationFn: () =>
      addSeason(item.id, {
        seasonNumber: item.seasons.length + 1,
        completed: false,
      }),
    onSuccess: onRefresh,
  });
  const toggleSeasonMutation = useMutation({
    mutationFn: (season: MediaItem['seasons'][number]) =>
      updateSeason(item.id, season.id, { completed: !season.completed }),
    onSuccess: onRefresh,
  });

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.mediaCard, pressed && styles.pressed]}>
      <View>
        <Poster uri={getCoverImage(item)} title={item.title} />
        <View style={styles.cardBadges}>
          <Pill>{item.type}</Pill>
          {item.rating && item.type !== 'music' ? <Pill>{item.rating}/10</Pill> : null}
        </View>
        <Pressable
          onPress={() => favoriteMutation.mutate()}
          style={styles.favoriteButton}
        >
          <Feather
            name="star"
            size={16}
            color={item.isFavorite ? palette.primary : palette.foreground}
          />
        </Pressable>
      </View>
      <Text style={styles.mediaTitle} numberOfLines={2}>
        {item.title}
      </Text>
      {item.type === 'series' || item.type === 'anime' ? (
        <View style={styles.seasonWrap}>
          {item.seasons.map((season) => (
            <Pressable
              key={season.id}
              onPress={() => toggleSeasonMutation.mutate(season)}
              style={[
                styles.seasonButton,
                season.completed && styles.seasonButtonDone,
              ]}
            >
              <Text
                style={[
                  styles.seasonText,
                  season.completed && styles.seasonTextDone,
                ]}
              >
                {season.completed ? '✓' : season.seasonNumber}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => addSeasonMutation.mutate()}
            style={styles.seasonButton}
          >
            <Feather name="plus" size={12} color={palette.mutedForeground} />
          </Pressable>
        </View>
      ) : item.type === 'music' && item.notes ? (
        <Text style={styles.mediaMeta} numberOfLines={1}>
          {item.notes}
        </Text>
      ) : null}
    </Pressable>
  );
}

function ResultSheet({
  visible,
  title,
  isLoading,
  results,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  isLoading: boolean;
  results: MetadataSearchResult[];
  onClose: () => void;
  onSelect: (result: MetadataSearchResult) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Card style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Choose a match</Text>
              <Text style={styles.modalSubtitle} numberOfLines={1}>{title}</Text>
            </View>
            <IconButton icon="x" label="Close" onPress={onClose} />
          </View>
          {isLoading ? (
            <LoadingState label="Working" />
          ) : (
            <View style={styles.resultList}>
              {results.map((result) => (
                <Pressable
                  key={`${result.source}-${result.id}`}
                  onPress={() => onSelect(result)}
                  style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
                >
                  <Poster uri={result.posterUrl} title={result.title} style={styles.resultPoster} />
                  <View style={styles.resultText}>
                    <Text style={styles.resultTitle} numberOfLines={2}>{result.title}</Text>
                    <Text style={styles.resultMeta} numberOfLines={2}>
                      {result.source === 'manual' ? 'Add manually' : `${result.type}${result.year ? ` - ${result.year}` : ''}`}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={palette.mutedForeground} />
                </Pressable>
              ))}
            </View>
          )}
        </Card>
      </View>
    </Modal>
  );
}

function EditMediaSheet({
  item,
  onClose,
  onRefresh,
}: {
  item: MediaItem | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>('movie');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const [cover, setCover] = useState<string | null>(null);

  React.useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setType(item.type);
    setRating(item.rating == null ? '' : String(item.rating));
    setNotes(item.notes || '');
    setCover(getCoverImage(item));
  }, [item]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMedia(item!.id, {
        title,
        type,
        rating: rating ? Number(rating) : null,
        notes,
        coverImageUrl: cover,
      }),
    onSuccess: () => {
      onRefresh();
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMedia(item!.id),
    onSuccess: () => {
      onRefresh();
      onClose();
    },
  });

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      const mime = result.assets[0].mimeType || 'image/jpeg';
      setCover(`data:${mime};base64,${result.assets[0].base64}`);
    }
  };

  return (
    <Modal visible={Boolean(item)} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Card style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Title</Text>
            <IconButton icon="x" label="Close" onPress={onClose} />
          </View>
          <Pressable onPress={pickCover}>
            <Poster uri={cover} title={title} style={styles.editPoster} />
          </Pressable>
          <Field label="Title" value={title} onChangeText={setTitle} />
          <SegmentedControl value={type} options={TYPE_OPTIONS} onChange={setType} compact />
          {type !== 'music' ? (
            <Field
              label="Rating"
              icon="star"
              value={rating}
              onChangeText={setRating}
              keyboardType="decimal-pad"
              placeholder="0-10"
            />
          ) : null}
          <TextArea label="Notes" value={notes} onChangeText={setNotes} />
          <Button
            label="Save Changes"
            icon="save"
            onPress={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          />
          <Button
            label="Remove from Vault"
            icon="trash-2"
            variant="danger"
            onPress={() => deleteMutation.mutate()}
            loading={deleteMutation.isPending}
          />
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  quickCard: {
    gap: 12,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  quickField: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  mediaCard: {
    width: '47.8%',
    gap: 8,
  },
  pressed: {
    opacity: 0.76,
  },
  cardBadges: {
    position: 'absolute',
    left: 8,
    top: 8,
    right: 42,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.overlay,
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  mediaTitle: {
    color: palette.foreground,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_700Bold',
  },
  mediaMeta: {
    color: palette.mutedForeground,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  seasonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  seasonButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.secondary,
    borderWidth: 1,
    borderColor: palette.border,
  },
  seasonButtonDone: {
    backgroundColor: palette.foreground,
  },
  seasonText: {
    color: palette.mutedForeground,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  seasonTextDone: {
    color: palette.background,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  modalCard: {
    maxHeight: '88%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    color: palette.foreground,
    fontSize: 19,
    fontFamily: 'Inter_700Bold',
  },
  modalSubtitle: {
    color: palette.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  resultList: {
    gap: 10,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: palette.secondary,
    borderWidth: 1,
    borderColor: palette.border,
  },
  resultPoster: {
    width: 52,
    height: 76,
    aspectRatio: undefined,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    color: palette.foreground,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Inter_700Bold',
  },
  resultMeta: {
    color: palette.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  editPoster: {
    height: 210,
    aspectRatio: undefined,
  },
});
