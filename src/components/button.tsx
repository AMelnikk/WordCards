import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'success';

const VARIANTS: Record<Variant, { background: string; foreground: string }> = {
  primary: { background: Colors.accent, foreground: Colors.onAccent },
  secondary: { background: Colors.surfaceRaised, foreground: Colors.text },
  danger: { background: Colors.dangerSoft, foreground: Colors.danger },
  success: { background: Colors.success, foreground: Colors.onAccent },
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  style,
}: ButtonProps) {
  const { background, foreground } = VARIANTS[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { backgroundColor: background }, disabled && styles.disabled, style]}>
      {icon && <Ionicons name={icon} size={19} color={foreground} />}
      <Text style={[styles.title, { color: foreground }]} numberOfLines={1}>
        {title}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  title: {
    ...Type.headline,
  },
  disabled: {
    opacity: 0.4,
  },
});
