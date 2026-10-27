import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Springs } from '@/constants/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Scale applied while the finger is down. */
  scaleTo?: number;
};

/** A Pressable that gently shrinks while pressed. */
export function PressableScale({
  scaleTo = 0.97,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        scale.set(withSpring(scaleTo, Springs.snappy));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, Springs.snappy));
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}
