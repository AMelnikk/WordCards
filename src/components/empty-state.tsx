import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors, Spacing, Type } from '@/constants/theme';

type EmptyStateProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={34} color={Colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action && <View style={styles.action}>{action}</View>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.eight,
    gap: Spacing.three,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    ...Type.title,
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    ...Type.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  action: {
    marginTop: Spacing.four,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
