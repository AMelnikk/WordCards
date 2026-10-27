import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { DeckComplete } from '@/components/deck-complete';
import { EmptyState } from '@/components/empty-state';
import { FlashCard, type SwipeDirection } from '@/components/flash-card';
import { IconButton } from '@/components/icon-button';
import { ProgressBar } from '@/components/progress-bar';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, Spacing, Type } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useLearningDay } from '@/lib/learning-day';
import { advance, buildQueue, getDeckStats, syncQueue, type QueueItem } from '@/lib/session';
import { useDeck, useDeckProgress, useDeckStore } from '@/store/deck-store';

const MAX_CARD_WIDTH = 420;
const CARD_ASPECT = 1.45;
const EMPTY_SESSION = { known: 0, again: 0 };

type StageSize = { width: number; height: number };

export default function LearnScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deck = useDeck(id);
  const progress = useDeckProgress(id);
  const markLearned = useDeckStore((state) => state.markLearned);
  const resetProgress = useDeckStore((state) => state.resetProgress);
  const touchDeck = useDeckStore((state) => state.touchDeck);
  const day = useLearningDay();
  const insets = useSafeAreaInsets();
  const { t, languageName } = useTranslation();

  const [queue, setQueue] = useState<QueueItem[]>(() =>
    deck ? buildQueue(deck, progress, day) : []
  );
  const [sessionDay, setSessionDay] = useState(day);
  const [syncedCards, setSyncedCards] = useState(deck?.cards);
  /** Cards that were swiped and are still flying off screen. */
  const [leaving, setLeaving] = useState<QueueItem[]>([]);
  const [session, setSession] = useState(EMPTY_SESSION);
  const [stage, setStage] = useState<StageSize | null>(null);

  useEffect(() => {
    if (id) touchDeck(id);
  }, [id, touchDeck]);

  // Keep the session in step with the outside world: a new learning day starts a
  // fresh session, and cards added or deleted mid-session join or leave the queue.
  if (deck && day !== sessionDay) {
    setSessionDay(day);
    setSyncedCards(deck.cards);
    setQueue(buildQueue(deck, progress, day));
    setSession(EMPTY_SESSION);
  } else if (deck && deck.cards !== syncedCards) {
    setSyncedCards(deck.cards);
    setQueue(syncQueue(queue, deck, progress, day));
  }

  if (!deck) return <View style={styles.screen} />;

  const stats = getDeckStats(deck, progress, day);
  const top = queue[0];
  const next = queue[1];
  const finished = deck.cards.length > 0 && queue.length === 0 && leaving.length === 0;

  const handleSwipe = (item: QueueItem, direction: SwipeDirection) => {
    const known = direction === 'right';
    setLeaving((current) => [...current, item]);
    setQueue((current) => advance(current, item, known));
    if (known) {
      markLearned(deck.id, item.cardId, item.side, day);
      setSession((current) => ({ ...current, known: current.known + 1 }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setSession((current) => ({ ...current, again: current.again + 1 }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }
  };

  const handleSwipeComplete = (item: QueueItem) => {
    setLeaving((current) => current.filter((entry) => entry.key !== item.key));
  };

  const practiceAgain = () => {
    resetProgress(deck.id);
    setQueue(buildQueue(deck, {}, day));
    setSession(EMPTY_SESSION);
  };

  const cardWidth = stage ? Math.min(stage.width - Spacing.six * 2, MAX_CARD_WIDTH) : 0;
  const cardHeight = stage ? Math.min(stage.height - 56, cardWidth * CARD_ASPECT) : 0;

  // Rendered bottom-up: the waiting card, the current card, then any cards still flying away.
  const stack = [
    ...(next ? [{ item: next, position: 1, interactive: false }] : []),
    ...(top ? [{ item: top, position: 0, interactive: true }] : []),
    ...leaving.map((item) => ({ item, position: 0, interactive: false })),
  ];

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={deck.name}
        left={
          <IconButton
            icon="close"
            accessibilityLabel={t('common.close')}
            onPress={() => router.back()}
          />
        }
        right={
          <IconButton
            icon="create-outline"
            accessibilityLabel={t('learn.editCards')}
            onPress={() => router.push(`/deck/${deck.id}`)}
          />
        }
      />

      {deck.cards.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title={t('learn.emptyTitle')}
          message={t('learn.emptyMessage')}
          action={
            <Button
              title={t('learn.addCards')}
              icon="add"
              onPress={() => router.push({ pathname: '/card-form', params: { deckId: deck.id } })}
            />
          }
        />
      ) : finished ? (
        <DeckComplete
          cardCount={deck.cards.length}
          known={session.known}
          again={session.again}
          onPracticeAgain={practiceAgain}
          onDone={() => router.dismissTo('/')}
        />
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={styles.session}>
          <View style={styles.progressRow}>
            <ProgressBar
              progress={stats.sidesDone / (stats.cards * 2)}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {stats.learned}/{stats.cards}
            </Text>
          </View>

          <View
            style={[styles.stage, { marginBottom: insets.bottom + Spacing.four }]}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setStage({ width, height });
            }}>
            {stage &&
              stack.map(({ item, position, interactive }) => {
                const card = deck.cards.find((entry) => entry.id === item.cardId);
                if (!card) return null;
                const front = { lang: languageName(deck.frontLang), text: card.front };
                const back = { lang: languageName(deck.backLang), text: card.back };
                return (
                  <FlashCard
                    key={item.key}
                    prompt={item.side === 'front' ? front : back}
                    answer={item.side === 'front' ? back : front}
                    example={card.example}
                    width={cardWidth}
                    height={cardHeight}
                    position={position}
                    interactive={interactive}
                    onSwipe={(direction) => handleSwipe(item, direction)}
                    onSwipeComplete={() => handleSwipeComplete(item)}
                    onEdit={() =>
                      router.push({
                        pathname: '/card-form',
                        params: { deckId: deck.id, cardId: card.id },
                      })
                    }
                  />
                );
              })}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  session: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.six,
    paddingTop: Spacing.two,
  },
  progressBar: {
    flex: 1,
  },
  progressText: {
    ...Type.caption,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
    minWidth: 36,
    textAlign: 'right',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
