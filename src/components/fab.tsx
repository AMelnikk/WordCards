import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { popIn } from '@/constants/motion';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';

type FabProps = {
  label: string;
  onPress: () => void;
};

/** Floating "add" button pinned to the bottom-right corner. */
export function Fab({ label, onPress }: FabProps) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={popIn(250)}
      style={[styles.container, { bottom: insets.bottom + Spacing.five }]}>
      <PressableScale
        accessibilityRole="button"
        onPress={onPress}
        scaleTo={0.94}
        style={styles.button}>
        <Ionicons name="add" size={22} color={Colors.onAccent} />
        <Text style={styles.label}>{label}</Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Spacing.five,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    height: 54,
    paddingLeft: Spacing.four,
    paddingRight: Spacing.five,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    boxShadow: '0 8px 24px rgba(142, 148, 255, 0.35)',
  },
  label: {
    ...Type.headline,
    color: Colors.onAccent,
  },
});
