import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { IconButton } from '@/components/icon-button';
import { PressableScale } from '@/components/pressable-scale';
import { ScreenHeader } from '@/components/screen-header';
import { listTransition } from '@/constants/motion';
import { Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useLearningDay } from '@/lib/learning-day';
import { getDeckStats, isSideDone } from '@/lib/session';
import { useDeck, useDeckProgress } from '@/store/deck-store';
import type { Card } from '@/store/types';

const SEARCH_THRESHOLD = 6;

function matches(card: Card, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return [card.front, card.back, card.example].some((text) =>
    text.toLocaleLowerCase().includes(needle)
  );
}

export default function DeckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deck = useDeck(id);
  const progress = useDeckProgress(id);
  const day = useLearningDay();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { t, tn, languageName } = useTranslation();

  if (!deck) return <View style={styles.screen} />;

  const stats = getDeckStats(deck, progress, day);
  const cards = [...deck.cards].reverse().filter((card) => matches(card, query));
  const addCard = () => router.push({ pathname: '/card-form', params: { deckId: deck.id } });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        left={
          <IconButton
            icon="chevron-back"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
          />
        }
        right={
          <IconButton
            icon="create-outline"
            accessibilityLabel={t('deck.edit')}
            onPress={() => router.push({ pathname: '/deck-form', params: { id: deck.id } })}
          />
        }
      />
      <Animated.FlatList
        data={cards}
        keyExtractor={(card) => card.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        itemLayoutAnimation={listTransition}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
            <Text style={styles.title}>{deck.name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{languageName(deck.frontLang)}</Text>
              <Ionicons name="swap-horizontal" size={15} color={Colors.textMuted} />
              <Text style={styles.meta}>{languageName(deck.backLang)}</Text>
              <Text style={styles.metaMuted}>·</Text>
              <Text style={styles.meta}>{tn('count.cards', stats.cards)}</Text>
              {stats.cards > 0 && (
                <>
                  <Text style={styles.metaMuted}>·</Text>
                  <Text style={styles.meta}>
                    {t('deck.learnedToday', { count: stats.learned })}
                  </Text>
                </>
              )}
            </View>
            {stats.cards > 0 && (
              <Button
                title={t('deck.startLearning')}
                icon="play"
                onPress={() => router.push(`/learn/${deck.id}`)}
                style={styles.learnButton}
              />
            )}
            {deck.cards.length >= SEARCH_THRESHOLD && (
              <View style={styles.search}>
                <Ionicons name="search" size={18} color={Colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('deck.search')}
                  placeholderTextColor={Colors.textMuted}
                  selectionColor={Colors.accent}
                  keyboardAppearance="dark"
                  returnKeyType="search"
                  style={styles.searchInput}
                />
                {query.length > 0 && (
                  <IconButton
                    icon="close-circle"
                    size={18}
                    filled={false}
                    color={Colors.textMuted}
                    accessibilityLabel={t('deck.clearSearch')}
                    onPress={() => setQuery('')}
                  />
                )}
              </View>
            )}
            {deck.cards.length > 0 && (
              <Text style={styles.sectionLabel}>
                {query ? t('deck.found', { count: cards.length }) : t('deck.newestFirst')}
              </Text>
            )}
          </Animated.View>
        }
        ListEmptyComponent={
          deck.cards.length === 0 ? (
            <EmptyState
              icon="albums-outline"
              title={t('deck.emptyTitle')}
              message={t('deck.emptyMessage')}
              action={<Button title={t('deck.addFirstCard')} icon="add" onPress={addCard} />}
            />
          ) : (
            <Text style={styles.noResults}>{t('deck.noResults', { query: query.trim() })}</Text>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={
              query
                ? FadeIn.duration(250)
                : FadeInDown.delay(80 + Math.min(index, 10) * 40).duration(350)
            }
            exiting={FadeOut.duration(200)}>
            <CardRow
              card={item}
              frontDone={isSideDone(progress, item.id, 'front', day)}
              backDone={isSideDone(progress, item.id, 'back', day)}
              onPress={() =>
                router.push({
                  pathname: '/card-form',
                  params: { deckId: deck.id, cardId: item.id },
                })
              }
            />
          </Animated.View>
        )}
      />
      {deck.cards.length > 0 && <Fab label={t('deck.addCard')} onPress={addCard} />}
    </View>
  );
}

type CardRowProps = {
  card: Card;
  frontDone: boolean;
  backDone: boolean;
  onPress: () => void;
};

function CardRow({ card, frontDone, backDone, onPress }: CardRowProps) {
  const { t } = useTranslation();
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowFront} numberOfLines={2}>
          {card.front}
        </Text>
        <Text style={styles.rowBack} numberOfLines={2}>
          {card.back}
        </Text>
        {card.example.length > 0 && (
          <Text style={styles.rowExample} numberOfLines={1}>
            {card.example}
          </Text>
        )}
      </View>
      <View
        style={styles.dots}
        accessibilityLabel={t('deck.sidesDone', { count: Number(frontDone) + Number(backDone) })}>
        <View style={[styles.dot, frontDone && styles.dotDone]} />
        <View style={[styles.dot, backDone && styles.dotDone]} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.two + 2,
    paddingHorizontal: Spacing.five,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
    paddingTop: Spacing.two,
  },
  title: {
    ...Type.largeTitle,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  meta: {
    ...Type.callout,
    color: Colors.textSecondary,
  },
  metaMuted: {
    ...Type.callout,
    color: Colors.textMuted,
  },
  learnButton: {
    marginTop: Spacing.four,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing.four,
    paddingRight: Spacing.one,
    marginTop: Spacing.three,
    minHeight: 48,
  },
  searchInput: {
    ...Type.body,
    flex: 1,
    color: Colors.text,
    paddingVertical: Spacing.three,
  },
  sectionLabel: {
    ...Type.overline,
    color: Colors.textMuted,
    marginTop: Spacing.five,
  },
  noResults: {
    ...Type.body,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.eight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.five,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  rowFront: {
    ...Type.headline,
    color: Colors.text,
  },
  rowBack: {
    ...Type.callout,
    color: Colors.accent,
  },
  rowExample: {
    ...Type.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.one,
  },
  dots: {
    gap: Spacing.one + 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.surfacePressed,
  },
  dotDone: {
    backgroundColor: Colors.success,
  },
});
