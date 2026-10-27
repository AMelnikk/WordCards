import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useSettingsStore } from '@/store/settings-store';

/** Cycles the UI language (EN → DE → RU) on every tap. */
export function LanguageSwitch() {
  const cycleLanguage = useSettingsStore((state) => state.cycleLanguage);
  const { t, language } = useTranslation();

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${t('language.switch')}: ${t('language.name')}`}
      hitSlop={8}
      scaleTo={0.92}
      onPress={() => {
        Haptics.selectionAsync();
        cycleLanguage();
      }}
      style={styles.switch}>
      <Ionicons name="language" size={16} color={Colors.textSecondary} />
      <View style={styles.codeBox}>
        <Animated.Text key={language} entering={FadeInDown.duration(220)} style={styles.code}>
          {language.toUpperCase()}
        </Animated.Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    height: 34,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeBox: {
    minWidth: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  code: {
    ...Type.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.text,
  },
});
