import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Colors } from '@/constants/theme';

type IconButtonProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  size?: number;
  filled?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  color = Colors.text,
  size = 22,
  filled = true,
  disabled = false,
  style,
}: IconButtonProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      scaleTo={0.9}
      style={[styles.button, filled && styles.filled, disabled && styles.disabled, style]}>
      <Ionicons name={icon} size={size} color={color} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: Colors.surfaceRaised,
  },
  disabled: {
    opacity: 0.4,
  },
});
