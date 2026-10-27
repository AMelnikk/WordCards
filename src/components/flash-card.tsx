import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { IconButton } from '@/components/icon-button';
import { Springs } from '@/constants/motion';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTranslation } from '@/i18n';

export type SwipeDirection = 'left' | 'right';

type FaceContent = {
  lang: string;
  text: string;
};

type FlashCardProps = {
  prompt: FaceContent;
  answer: FaceContent;
  example: string;
  width: number;
  height: number;
  /** 0 for the card on top, 1 for the one waiting behind it. */
  position: number;
  interactive: boolean;
  /** Swipe committed; the card starts flying off screen. */
  onSwipe: (direction: SwipeDirection) => void;
  /** The card has left the screen and can be unmounted. */
  onSwipeComplete: () => void;
  onEdit: () => void;
};

const FLIP_DURATION = 520;
const FLY_DURATION = 300;
/** Before the first flip the card only budges a little, hinting that it needs a tap first. */
const LOCKED_RESISTANCE = 0.15;

export function FlashCard({
  prompt,
  answer,
  example,
  width,
  height,
  position,
  interactive,
  onSwipe,
  onSwipeComplete,
  onEdit,
}: FlashCardProps) {
  const { t } = useTranslation();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const flip = useSharedValue(0);
  // New cards start one step further back and spring forward into place.
  const depth = useSharedValue(position + 1);
  const revealed = useSharedValue(false);
  const committed = useSharedValue(false);
  /** Briefly highlights "Tap to flip" when the user swipes before flipping. */
  const hintPulse = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);

  const threshold = width * 0.3;
  const exitDistance = width * 1.6;

  useEffect(() => {
    depth.set(withSpring(position, Springs.stack));
  }, [position, depth]);

  const toggleFlip = () => {
    const next = !flipped;
    setFlipped(next);
    revealed.set(true);
    flip.set(
      withTiming(next ? 1 : 0, { duration: FLIP_DURATION, easing: Easing.out(Easing.cubic) })
    );
    Haptics.selectionAsync();
  };

  const warnLocked = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const pan = usePanGesture({
    enabled: interactive,
    activeOffsetX: [-10, 10],
    onUpdate: (event) => {
      if (committed.get()) return;
      const resistance = revealed.get() ? 1 : LOCKED_RESISTANCE;
      translateX.set(event.translationX * resistance);
      translateY.set(event.translationY * resistance * 0.35);
    },
    onDeactivate: (event) => {
      if (committed.get()) return;
      const x = translateX.get();
      const flung =
        Math.abs(event.velocityX) > 900 &&
        Math.sign(event.velocityX) === Math.sign(x) &&
        Math.abs(x) > 30;
      if (revealed.get() && !event.canceled && (Math.abs(x) > threshold || flung)) {
        const direction: SwipeDirection = x > 0 ? 'right' : 'left';
        committed.set(true);
        scheduleOnRN(onSwipe, direction);
        translateX.set(
          withTiming(
            (x > 0 ? 1 : -1) * exitDistance,
            { duration: FLY_DURATION, easing: Easing.out(Easing.quad) },
            (finished) => {
              if (finished) scheduleOnRN(onSwipeComplete);
            }
          )
        );
        translateY.set(withTiming(translateY.get() + 50, { duration: FLY_DURATION }));
        return;
      }
      translateX.set(withSpring(0, Springs.settle));
      translateY.set(withSpring(0, Springs.settle));
      if (!revealed.get()) {
        hintPulse.set(
          withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 700 }))
        );
        scheduleOnRN(warnLocked);
      }
    },
  });

  const tap = useTapGesture({
    enabled: interactive,
    maxDistance: 12,
    runOnJS: true,
    onActivate: () => {
      if (!committed.get()) toggleFlip();
    },
  });

  const gesture = useCompetingGestures(pan, tap);

  const cardStyle = useAnimatedStyle(() => {
    const stackDepth = depth.get();
    // Grow slightly mid-flip so the card feels lifted off the table.
    const lift = Math.sin(flip.get() * Math.PI) * 0.04;
    return {
      opacity: interpolate(stackDepth, [0, 1, 2], [1, 0.7, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: translateX.get() },
        { translateY: translateY.get() + stackDepth * (height * 0.04 + 14) },
        { rotate: `${interpolate(translateX.get(), [-width, 0, width], [-12, 0, 12])}deg` },
        { scale: interpolate(stackDepth, [0, 1], [1, 0.92]) * (1 + lift) },
      ],
    };
  });

  const promptFaceStyle = useAnimatedStyle(() => ({
    opacity: flip.get() < 0.5 ? 1 : 0,
    transform: [{ perspective: 1400 }, { rotateY: `${flip.get() * 180}deg` }],
  }));

  const answerFaceStyle = useAnimatedStyle(() => ({
    opacity: flip.get() < 0.5 ? 0 : 1,
    transform: [{ perspective: 1400 }, { rotateY: `${flip.get() * 180 - 180}deg` }],
  }));

  // Stamps fade in only after a small dead zone, so springy settling never shows them.
  const deadZone = threshold * 0.2;

  const knowStyle = useAnimatedStyle(() => ({
    opacity: revealed.get()
      ? interpolate(translateX.get(), [deadZone, threshold], [0, 1], Extrapolation.CLAMP)
      : 0,
  }));

  const againStyle = useAnimatedStyle(() => ({
    opacity: revealed.get()
      ? interpolate(translateX.get(), [-threshold, -deadZone], [1, 0], Extrapolation.CLAMP)
      : 0,
  }));

  // The edit button stays flat while the faces turn, so it fades out mid-flip and while swiping.
  const menuStyle = useAnimatedStyle(() => ({
    opacity:
      (1 - Math.sin(flip.get() * Math.PI)) *
      interpolate(Math.abs(translateX.get()), [0, deadZone], [1, 0], Extrapolation.CLAMP) *
      interpolate(depth.get(), [0, 0.5], [1, 0], Extrapolation.CLAMP),
  }));

  const hintStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      hintPulse.get(),
      [0, 1],
      ['rgba(142, 148, 255, 0)', Colors.accentSoft]
    ),
    transform: [{ scale: 1 + hintPulse.get() * 0.08 }],
  }));

  const hintTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(hintPulse.get(), [0, 1], [Colors.textMuted, Colors.accent]),
  }));

  return (
    <Animated.View style={[styles.card, { width, height }, cardStyle]}>
      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            flipped ? `${answer.lang}: ${answer.text}` : `${prompt.lang}: ${prompt.text}`
          }
          accessibilityHint={t('card.flipHint')}
          style={styles.surface}>
          <Animated.View style={[styles.face, styles.facePrompt, promptFaceStyle]}>
            <LangPill lang={prompt.lang} />
            <FaceBody text={prompt.text} />
            <Animated.View style={[styles.flipHint, hintStyle]}>
              <Ionicons name="sync-outline" size={14} color={Colors.textMuted} />
              <Animated.Text style={[styles.flipHintText, hintTextStyle]}>
                {t('card.tapToFlip')}
              </Animated.Text>
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.face, styles.faceAnswer, answerFaceStyle]}>
            <LangPill lang={answer.lang} highlighted />
            <FaceBody text={answer.text} subtitle={prompt.text} />
            {example.length > 0 && (
              <View style={styles.example}>
                <Ionicons name="chatbubble-ellipses-outline" size={15} color={Colors.textMuted} />
                <Text style={styles.exampleText} numberOfLines={4}>
                  {example}
                </Text>
              </View>
            )}
            <View style={styles.swipeHints}>
              <View style={styles.swipeHint}>
                <Ionicons name="arrow-back" size={14} color={Colors.danger} />
                <Text style={[styles.swipeHintText, { color: Colors.danger }]}>
                  {t('card.again')}
                </Text>
              </View>
              <View style={styles.swipeHint}>
                <Text style={[styles.swipeHintText, { color: Colors.success }]}>
                  {t('card.know')}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.success} />
              </View>
            </View>
          </Animated.View>

          <Stamp
            style={[styles.overlay, styles.overlayKnow, knowStyle]}
            stampStyle={styles.stampKnow}
            icon="checkmark"
            color={Colors.success}
            label={t('card.know')}
          />
          <Stamp
            style={[styles.overlay, styles.overlayAgain, againStyle]}
            stampStyle={styles.stampAgain}
            icon="refresh"
            color={Colors.danger}
            label={t('card.again')}
          />
        </View>
      </GestureDetector>

      {/* A sibling of the gesture surface rather than a child, so tapping it never flips the card.
          Only the top card has one, so screen readers never land on a hidden button. */}
      {interactive && (
        <Animated.View style={[styles.menu, menuStyle]}>
          <IconButton
            icon="ellipsis-horizontal"
            size={18}
            color={Colors.textSecondary}
            accessibilityLabel={t('card.edit')}
            onPress={onEdit}
            style={styles.menuButton}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

function wordSize(text: string) {
  const length = text.length;
  if (length <= 10) return 40;
  if (length <= 18) return 34;
  if (length <= 32) return 28;
  if (length <= 64) return 23;
  return 19;
}

function LangPill({ lang, highlighted = false }: { lang: string; highlighted?: boolean }) {
  return (
    <View style={[styles.langPill, highlighted && styles.langPillAnswer]}>
      <Text style={[styles.langText, highlighted && styles.langTextAnswer]} numberOfLines={1}>
        {lang}
      </Text>
    </View>
  );
}

function FaceBody({ text, subtitle }: { text: string; subtitle?: string }) {
  const size = wordSize(text);
  return (
    <View style={styles.faceBody}>
      <Text
        style={[styles.word, { fontSize: size, lineHeight: Math.round(size * 1.2) }]}
        numberOfLines={6}
        adjustsFontSizeToFit
        minimumFontScale={0.6}>
        {text}
      </Text>
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

type StampProps = {
  style: ComponentProps<typeof Animated.View>['style'];
  stampStyle: ComponentProps<typeof View>['style'];
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
};

function Stamp({ style, stampStyle, icon, color, label }: StampProps) {
  return (
    <Animated.View pointerEvents="none" style={style}>
      <View style={[styles.stamp, stampStyle]}>
        <Ionicons name={icon} size={17} color={color} />
        <Text style={[styles.stampText, { color }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: Radius.xl,
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)',
  },
  surface: {
    ...StyleSheet.absoluteFill,
  },
  face: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.six,
    backfaceVisibility: 'hidden',
    alignItems: 'center',
    gap: Spacing.four,
  },
  facePrompt: {
    backgroundColor: Colors.cardFront,
    borderColor: Colors.border,
  },
  faceAnswer: {
    backgroundColor: Colors.cardBack,
    borderColor: 'rgba(142, 148, 255, 0.28)',
  },
  langPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfacePressed,
    maxWidth: '70%',
  },
  langPillAnswer: {
    backgroundColor: Colors.accentSoft,
  },
  langText: {
    ...Type.overline,
    color: Colors.textSecondary,
  },
  langTextAnswer: {
    color: Colors.accent,
  },
  faceBody: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  word: {
    color: Colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    ...Type.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  example: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: Spacing.two + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radius.md,
    padding: Spacing.four,
  },
  exampleText: {
    ...Type.callout,
    fontWeight: '400',
    fontStyle: 'italic',
    color: Colors.textSecondary,
    flex: 1,
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  flipHintText: {
    ...Type.caption,
  },
  swipeHints: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    opacity: 0.75,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  swipeHintText: {
    ...Type.caption,
  },
  menu: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.xl,
    borderWidth: 2,
    padding: Spacing.five,
  },
  overlayKnow: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(74, 222, 128, 0.07)',
    alignItems: 'flex-start',
  },
  overlayAgain: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(248, 113, 113, 0.07)',
    alignItems: 'flex-end',
  },
  stamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.sm,
    borderWidth: 2,
    backgroundColor: Colors.background,
  },
  stampKnow: {
    borderColor: Colors.success,
    transform: [{ rotate: '-10deg' }],
  },
  stampAgain: {
    borderColor: Colors.danger,
    transform: [{ rotate: '10deg' }],
  },
  stampText: {
    ...Type.overline,
    fontSize: 14,
  },
});
