import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
};

/** Asks before a destructive action. Falls back to `window.confirm` on web, where Alert is a no-op. */
export function confirmDestructive({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: ConfirmOptions) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
