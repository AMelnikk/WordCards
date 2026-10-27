import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

const PALETTE = [Colors.accent, Colors.success, Colors.warning, '#F472B6', '#60A5FA'];
const GRAVITY = 900;
const DRAG = 1.8;

type Piece = {
  vx: number;
  vy: number;
  spin: number;
  flutter: number;
  color: string;
  width: number;
  height: number;
  duration: number;
  delay: number;
};

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
    const speed = 320 + Math.random() * 480;
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: (Math.random() - 0.5) * 900,
      flutter: 5 + Math.random() * 7,
      color: PALETTE[index % PALETTE.length],
      width: 6 + Math.random() * 5,
      height: 10 + Math.random() * 8,
      duration: 2200 + Math.random() * 1000,
      delay: Math.random() * 150,
    };
  });
}

/** A one-shot burst of paper confetti from the parent's center. */
export function Confetti({ count = 46 }: { count?: number }) {
  const [pieces] = useState(() => makePieces(count));

  return (
    <View pointerEvents="none" style={styles.origin}>
      {pieces.map((piece, index) => (
        <ConfettiPiece key={index} piece={piece} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece }: { piece: Piece }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(piece.delay, withTiming(1, { duration: piece.duration, easing: Easing.linear }))
    );
  }, [piece, progress]);

  const style = useAnimatedStyle(() => {
    // Projectile motion with linear air drag, so pieces slow down and drift like paper.
    const t = (progress.get() * piece.duration) / 1000;
    const decay = (1 - Math.exp(-DRAG * t)) / DRAG;
    return {
      opacity: interpolate(progress.get(), [0, 0.02, 0.7, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: piece.vx * decay },
        { translateY: piece.vy * decay + (GRAVITY / DRAG) * (t - decay) },
        { rotate: `${piece.spin * t}deg` },
        { scaleY: Math.cos(t * piece.flutter) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: piece.width,
          height: piece.height,
          marginLeft: -piece.width / 2,
          marginTop: -piece.height / 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  origin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
  },
  piece: {
    position: 'absolute',
    borderRadius: 2,
  },
});
