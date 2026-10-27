import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { DeckTile } from '@/components/deck-tile';
import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { LanguageSwitch } from '@/components/language-switch';
import { listTransition } from '@/constants/motion';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useLearningDay } from '@/lib/learning-day';
import { getDeckStats } from '@/lib/session';
import { useDeckStore } from '@/store/deck-store';
import { useHydrated } from '@/store/use-hydrated';

/** Today's date in the app's language (not the device's). */
function formatToday(locale: string) {
  return new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function DecksScreen() {
  const hydrated = useHydrated();
  const decks = useDeckStore((state) => state.decks);
  const progress = useDeckStore((state) => state.progress);
  const day = useLearningDay();
  const insets = useSafeAreaInsets();
  const { t, tn, locale } = useTranslation();

  const items = [...decks]
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .map((deck) => ({ deck, stats: getDeckStats(deck, progress[deck.id] ?? {}, day) }));
  const completedCount = items.filter(
    ({ stats }) => stats.cards > 0 && stats.learned === stats.cards
  ).length;
  const cardCount = decks.reduce((sum, deck) => sum + deck.cards.length, 0);

  if (!hydrated) return <View style={styles.screen} />;

  const createDeck = () => router.push('/deck-form');

  return (
    <View style={styles.screen}>
      <Animated.FlatList
        data={items}
        keyExtractor={(item) => item.deck.id}
        itemLayoutAnimation={listTransition}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + 120 },
        ]}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <View style={styles.topRow}>
              <Text style={styles.date} numberOfLines={1}>
                {formatToday(locale)}
              </Text>
              <LanguageSwitch />
            </View>
            <Text style={styles.title}>{t('home.title')}</Text>
            {decks.length > 0 && (
              <Text style={styles.summary}>
                {[
                  tn('count.decks', decks.length),
                  tn('count.cards', cardCount),
                  t('home.doneToday', { count: completedCount }),
                ].join(' · ')}
              </Text>
            )}
          </Animated.View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="layers-outline"
            title={t('home.emptyTitle')}
            message={t('home.emptyMessage')}
            action={<Button title={t('home.createDeck')} icon="add" onPress={createDeck} />}
          />
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(120 + index * 60).duration(450)}
            exiting={FadeOut.duration(200)}>
            <DeckTile
              deck={item.deck}
              stats={item.stats}
              onPress={() => router.push(`/learn/${item.deck.id}`)}
              onManage={() => router.push(`/deck/${item.deck.id}`)}
            />
          </Animated.View>
        )}
      />
      {decks.length > 0 && <Fab label={t('home.newDeck')} onPress={createDeck} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  date: {
    ...Type.overline,
    color: Colors.accent,
    flexShrink: 1,
  },
  title: {
    ...Type.largeTitle,
    color: Colors.text,
  },
  summary: {
    ...Type.callout,
    color: Colors.textSecondary,
    marginTop: Spacing.one,
  },
});
