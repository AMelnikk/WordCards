import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { FormScreen } from '@/components/form-screen';
import { IconButton } from '@/components/icon-button';
import { PressableScale } from '@/components/pressable-scale';
import { TextField } from '@/components/text-field';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { confirmDestructive } from '@/lib/confirm';
import { useDeck, useDeckStore } from '@/store/deck-store';

export default function DeckFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const deck = useDeck(id);
  // Based on the route, not on `deck`, so the screen keeps its look while closing after a delete.
  const editing = id !== undefined;
  const createDeck = useDeckStore((state) => state.createDeck);
  const updateDeck = useDeckStore((state) => state.updateDeck);
  const deleteDeck = useDeckStore((state) => state.deleteDeck);
  const { t, tn, languageName } = useTranslation();

  const [name, setName] = useState(deck?.name ?? '');
  const [frontLang, setFrontLang] = useState(
    deck ? languageName(deck.frontLang) : t('languageName.ru')
  );
  const [backLang, setBackLang] = useState(
    deck ? languageName(deck.backLang) : t('languageName.de')
  );

  const canSave = [name, frontLang, backLang].every((value) => value.trim().length > 0);

  const save = () => {
    if (!canSave) return;
    const input = { name, frontLang, backLang };
    if (editing) {
      if (deck) updateDeck(deck.id, input);
      router.back();
    } else {
      const newId = createDeck(input);
      router.replace(`/deck/${newId}`);
    }
  };

  const remove = () => {
    if (!deck) return;
    confirmDestructive({
      title: t('deckForm.deleteTitle'),
      message: tn('deckForm.deleteMessage', deck.cards.length, { name: deck.name }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => {
        router.dismissTo('/');
        deleteDeck(deck.id);
      },
    });
  };

  return (
    <FormScreen
      title={editing ? t('deckForm.editTitle') : t('deckForm.newTitle')}
      onClose={() => router.back()}
      footer={
        <Button
          title={editing ? t('common.saveChanges') : t('deckForm.create')}
          icon={editing ? 'checkmark' : 'add'}
          disabled={!canSave}
          onPress={save}
        />
      }>
      <TextField
        label={t('deckForm.name')}
        value={name}
        onChangeText={setName}
        placeholder={t('deckForm.namePlaceholder')}
        autoFocus={!editing}
        returnKeyType="done"
        onSubmitEditing={save}
        maxLength={60}
      />

      <View style={styles.languages}>
        <LanguageField
          label={t('deckForm.frontLang')}
          hint={t('deckForm.frontHint')}
          value={frontLang}
          onChange={setFrontLang}
        />
        <View style={styles.swapRow}>
          <View style={styles.swapLine} />
          <IconButton
            icon="swap-vertical"
            size={18}
            color={Colors.textSecondary}
            accessibilityLabel={t('deckForm.swap')}
            onPress={() => {
              setFrontLang(backLang);
              setBackLang(frontLang);
            }}
          />
          <View style={styles.swapLine} />
        </View>
        <LanguageField
          label={t('deckForm.backLang')}
          hint={t('deckForm.backHint')}
          value={backLang}
          onChange={setBackLang}
        />
      </View>

      {editing && (
        <Button
          title={t('deckForm.delete')}
          icon="trash-outline"
          variant="danger"
          onPress={remove}
          style={styles.deleteButton}
        />
      )}
    </FormScreen>
  );
}

type LanguageFieldProps = {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
};

function LanguageField({ label, hint, value, onChange }: LanguageFieldProps) {
  const { t, languageSuggestions } = useTranslation();
  return (
    <View style={styles.languageField}>
      <TextField
        label={label}
        hint={hint}
        value={value}
        onChangeText={onChange}
        placeholder={t('deckForm.langPlaceholder')}
        maxLength={30}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chips}>
        {languageSuggestions().map((language) => {
          const selected = language.toLowerCase() === value.trim().toLowerCase();
          return (
            <PressableScale
              key={language}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(language)}
              scaleTo={0.93}
              style={[styles.chip, selected && styles.chipSelected]}>
              {selected && <Ionicons name="checkmark" size={14} color={Colors.accent} />}
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{language}</Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  languages: {
    gap: Spacing.two,
  },
  languageField: {
    gap: Spacing.three,
  },
  chips: {
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.accentSoft,
    borderColor: 'rgba(142, 148, 255, 0.4)',
  },
  chipText: {
    ...Type.caption,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.accent,
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginVertical: Spacing.one,
  },
  swapLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  deleteButton: {
    marginTop: Spacing.two,
  },
});
