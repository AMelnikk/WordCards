import { LinearTransition, ZoomIn } from 'react-native-reanimated';

/**
 * Reanimated 4's default spring is mass 4 / stiffness 900 / damping 120 (critically damped).
 * Overriding only one of those values easily makes a spring wobble many times, so every spring
 * in the app is defined here with all of its parameters.
 */
export const Springs = {
  /** Quick, settles with at most a slight overshoot. Presses and small UI motion. */
  snappy: { mass: 0.6, stiffness: 320, damping: 18 },
  /** Card returning to the middle after an incomplete swipe. */
  settle: { mass: 1, stiffness: 220, damping: 21 },
  /** Card moving forward in the stack. */
  stack: { mass: 0.9, stiffness: 180, damping: 20 },
} as const;

/** Pops in with a single small bounce. */
export const popIn = (delay = 0) => ZoomIn.delay(delay).springify(450).dampingRatio(0.6);

/** Lists reflowing after an item moved or disappeared: no bounce. */
export const listTransition = LinearTransition.springify(400).dampingRatio(1);
