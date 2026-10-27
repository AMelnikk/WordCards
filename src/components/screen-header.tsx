import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, Type } from '@/constants/theme';

type ScreenHeaderProps = {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  /** iOS modals are presented as sheets below the status bar, so they skip the top inset. */
  modal?: boolean;
};

export function ScreenHeader({ title, left, right, modal = false }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const topInset = modal && Platform.OS === 'ios' ? Spacing.two : insets.top;

  return (
    <View style={[styles.header, { paddingTop: topInset + Spacing.two }]}>
      <View style={styles.side}>{left}</View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  side: {
    minWidth: 40,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  right: {
    justifyContent: 'flex-end',
  },
  title: {
    ...Type.headline,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
});
