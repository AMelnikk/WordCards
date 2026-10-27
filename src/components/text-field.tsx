import { useState, type Ref } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { Colors, Radius, Spacing, Type } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  ref?: Ref<TextInputInstance>;
};

export function TextField({ label, hint, style, onFocus, onBlur, ref, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <TextInput
        ref={ref}
        placeholderTextColor={Colors.textMuted}
        selectionColor={Colors.accent}
        cursorColor={Colors.accent}
        keyboardAppearance="dark"
        {...rest}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[styles.input, rest.multiline && styles.multiline, focused && styles.focused, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  label: {
    ...Type.overline,
    color: Colors.textSecondary,
  },
  hint: {
    ...Type.caption,
    color: Colors.textMuted,
  },
  input: {
    ...Type.body,
    fontSize: 17,
    color: Colors.text,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
    // The accent border already marks focus; hide the browser's own focus ring on web.
    outlineWidth: 0,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  focused: {
    borderColor: Colors.accent,
  },
});
