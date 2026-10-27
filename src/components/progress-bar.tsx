import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

type ProgressBarProps = {
  /** 0 to 1. */
  progress: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

/** Fills with the accent color and turns green once complete. */
export function ProgressBar({ progress, height = 6, style }: ProgressBarProps) {
  const value = useSharedValue(progress);

  useEffect(() => {
    value.set(withTiming(progress, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [progress, value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(1, Math.max(0, value.get())) * 100}%`,
    backgroundColor: interpolateColor(value.get(), [0.98, 1], [Colors.accent, Colors.success]),
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <Animated.View style={[styles.fill, { borderRadius: height / 2 }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.surfacePressed,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
