import { useEffect, useState, type ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { ScreenHeader } from '@/components/screen-header';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';

type FormScreenProps = {
  title: string;
  onClose: () => void;
  headerRight?: ReactNode;
  /** Main actions, pinned to the bottom so they stay reachable above the keyboard. */
  footer?: ReactNode;
  children: ReactNode;
};

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefix = Platform.OS === 'ios' ? 'keyboardWill' : 'keyboardDid';
    const show = Keyboard.addListener(`${prefix}Show`, () => setVisible(true));
    const hide = Keyboard.addListener(`${prefix}Hide`, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}

/** Shared shell for the modal forms: close button, title, a scroll area and pinned actions. */
export function FormScreen({ title, onClose, headerRight, footer, children }: FormScreenProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  // The keyboard covers the system navigation bar, so its inset is only needed without it.
  const keyboardVisible = useKeyboardVisible();
  const bottomInset = keyboardVisible ? 0 : insets.bottom;

  // 'padding' only adds as much space as the keyboard actually overlaps, so it is also
  // correct on edge-to-edge Android, where the window no longer resizes for the keyboard.
  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ScreenHeader
        modal
        title={title}
        left={<IconButton icon="close" accessibilityLabel={t('common.close')} onPress={onClose} />}
        right={headerRight}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: footer ? Spacing.six : bottomInset + Spacing.eight },
        ]}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
      {footer && (
        <View style={[styles.footer, { paddingBottom: bottomInset + Spacing.three }]}>
          <View style={[styles.inner, styles.footerInner]}>{footer}</View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.four,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.six,
  },
  footer: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  footerInner: {
    gap: Spacing.two + 2,
  },
});
