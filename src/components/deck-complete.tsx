import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Confetti } from '@/components/confetti';
import { popIn } from '@/constants/motion';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { DAY_START_HOUR } from '@/lib/learning-day';

type DeckCompleteProps = {
  cardCount: number;
  known: number;
  again: number;
  onPracticeAgain: () => void;
  onDone: () => void;
};

export function DeckComplete({
  cardCount,
  known,
  again,
  onPracticeAgain,
  onDone,
}: DeckCompleteProps) {
  const insets = useSafeAreaInsets();
  const { t, tn, list } = useTranslation();
  // Opened a deck that was already finished earlier today: no celebration, just a calm summary.
  const alreadyDone = known + again === 0;
  // An index rather than the text, so switching the language keeps the same message.
  const [messageIndex] = useState(() => Math.random());
  const messages = list('complete.messages');
  const message = messages[Math.floor(messageIndex * messages.length)];
  const accuracy = known + again > 0 ? Math.round((known / (known + again)) * 100) : 0;

  useEffect(() => {
    if (!alreadyDone) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [alreadyDone]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + Spacing.four }]}>
      <View style={styles.hero}>
        <View style={styles.badgeArea}>
          {!alreadyDone && (
            <>
              <PulseRing delay={0} />
              <PulseRing delay={1000} />
            </>
          )}
          <Animated.View
            entering={popIn(80)}
            style={[styles.badge, alreadyDone && styles.badgeCalm]}>
            <Ionicons name={alreadyDone ? 'moon' : 'checkmark'} size={52} color={Colors.onAccent} />
          </Animated.View>
          {!alreadyDone && <Confetti />}
        </View>

        <Animated.Text entering={FadeInDown.delay(250).duration(500)} style={styles.title}>
          {alreadyDone ? t('complete.alreadyTitle') : message.title}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(350).duration(500)} style={styles.subtitle}>
          {alreadyDone ? t('complete.alreadyMessage') : message.subtitle}
        </Animated.Text>

        {!alreadyDone && (
          <Animated.View entering={FadeInDown.delay(450).duration(500)} style={styles.stats}>
            <Stat value={String(cardCount)} label={tn('complete.cards', cardCount)} />
            <View style={styles.statDivider} />
            <Stat value={String(again)} label={tn('complete.repeats', again)} />
            <View style={styles.statDivider} />
            <Stat value={`${accuracy}%`} label={t('complete.accuracy')} />
          </Animated.View>
        )}
      </View>

      <Animated.View entering={FadeInDown.delay(550).duration(500)} style={styles.actions}>
        <Button title={t('complete.backToDecks')} onPress={onDone} />
        <Button
          title={t('complete.practiceAgain')}
          icon="refresh"
          variant="secondary"
          onPress={onPracticeAgain}
        />
        <Text style={styles.note}>{t('complete.comeBack', { time: `${DAY_START_HOUR}:00` })}</Text>
      </Animated.View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PulseRing({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }), -1)
      )
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 1], [0.45, 0]),
    transform: [{ scale: interpolate(progress.get(), [0, 1], [1, 2]) }],
  }));

  return <Animated.View style={[styles.ring, style]} />;
}

const BADGE_SIZE = 104;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.six,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  badgeArea: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.six,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 40px rgba(74, 222, 128, 0.35)',
  },
  badgeCalm: {
    backgroundColor: Colors.accent,
    boxShadow: '0 12px 40px rgba(142, 148, 255, 0.3)',
  },
  ring: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  title: {
    ...Type.largeTitle,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Type.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.six,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.four,
  },
  stat: {
    alignItems: 'center',
    minWidth: 92,
    gap: Spacing.half,
  },
  statValue: {
    ...Type.title,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...Type.caption,
    color: Colors.textMuted,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: Colors.border,
  },
  actions: {
    gap: Spacing.three,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  note: {
    ...Type.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
});
