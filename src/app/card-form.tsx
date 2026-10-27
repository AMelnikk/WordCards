import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '@/components/button';
import { FormScreen } from '@/components/form-screen';
import { IconButton } from '@/components/icon-button';
import { TextField } from '@/components/text-field';
import { popIn } from '@/constants/motion';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { confirmDestructive } from '@/lib/confirm';
import { useDeck, useDeckStore } from '@/store/deck-store';

export default function CardFormScreen() {
  const { deckId, cardId } = useLocalSearchParams<{ deckId: string; cardId?: string }>();
  const deck = useDeck(deckId);
  const card = deck?.cards.find((item) => item.id === cardId);
  // Based on the route, not on `card`, so the screen keeps its look while closing after a delete.
  const editing = cardId !== undefined;
  const addCard = useDeckStore((state) => state.addCard);
  const updateCard = useDeckStore((state) => state.updateCard);
  const deleteCard = useDeckStore((state) => state.deleteCard);
  const { t, languageName } = useTranslation();

  const [front, setFront] = useState(card?.front ?? '');
  const [back, setBack] = useState(card?.back ?? '');
  const [example, setExample] = useState(card?.example ?? '');
  const [addedCount, setAddedCount] = useState(0);

  const backRef = useRef<TextInputInstance>(null);
  const frontRef = useRef<TextInputInstance>(null);
  const exampleRef = useRef<TextInputInstance>(null);

  if (!deck) return <View style={styles.screen} />;

  const canSave = front.trim().length > 0 && back.trim().length > 0;

  const save = (addNext: boolean) => {
    if (!canSave) return;
    const input = { front, back, example };
    if (editing) {
      if (card) updateCard(deck.id, card.id, input);
      router.back();
      return;
    }
    addCard(deck.id, input);
    if (!addNext) {
      router.back();
      return;
    }
    setFront('');
    setBack('');
    setExample('');
    setAddedCount((count) => count + 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    backRef.current?.focus();
  };

  const remove = () => {
    if (!card) return;
    confirmDestructive({
      title: t('cardForm.deleteTitle'),
      message: t('cardForm.deleteMessage', { word: card.back, deck: deck.name }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => {
        router.back();
        deleteCard(deck.id, card.id);
      },
    });
  };

  return (
    <FormScreen
      title={editing ? t('cardForm.editTitle') : t('cardForm.newTitle')}
      onClose={() => router.back()}
      footer={
        editing ? (
          <Button
            title={t('common.saveChanges')}
            icon="checkmark"
            disabled={!canSave}
            onPress={() => save(false)}
          />
        ) : (
          <>
            <Button
              title={t('cardForm.saveNext')}
              icon="add"
              disabled={!canSave}
              onPress={() => save(true)}
            />
            <Button
              title={t('cardForm.saveClose')}
              variant="secondary"
              disabled={!canSave}
              onPress={() => save(false)}
            />
          </>
        )
      }
      headerRight={
        editing && (
          <IconButton
            icon="trash-outline"
            color={Colors.danger}
            accessibilityLabel={t('cardForm.delete')}
            onPress={remove}
          />
        )
      }>
      <View style={styles.deckRow}>
        <Ionicons name="layers-outline" size={16} color={Colors.textMuted} />
        <Text style={styles.deckName} numberOfLines={1}>
          {deck.name}
        </Text>
        {addedCount > 0 && (
          <Animated.View key={addedCount} entering={popIn()} style={styles.addedBadge}>
            <Ionicons name="checkmark" size={14} color={Colors.success} />
            <Text style={styles.addedText}>{t('cardForm.added', { count: addedCount })}</Text>
          </Animated.View>
        )}
      </View>

      <TextField
        ref={backRef}
        label={languageName(deck.backLang)}
        hint={t('cardForm.translationHint')}
        value={back}
        onChangeText={setBack}
        placeholder={t('cardForm.translationPlaceholder')}
        autoFocus={!editing}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => frontRef.current?.focus()}
      />
      <TextField
        ref={frontRef}
        label={languageName(deck.frontLang)}
        hint={t('cardForm.meaningHint')}
        value={front}
        onChangeText={setFront}
        placeholder={t('cardForm.meaningPlaceholder')}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => exampleRef.current?.focus()}
      />
      <TextField
        ref={exampleRef}
        label={t('cardForm.example')}
        hint={t('cardForm.optional')}
        value={example}
        onChangeText={setExample}
        placeholder={t('cardForm.examplePlaceholder')}
        multiline
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: -Spacing.two,
    minHeight: 26,
  },
  deckName: {
    ...Type.callout,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  addedBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Colors.successSoft,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  addedText: {
    ...Type.caption,
    color: Colors.success,
  },
});
