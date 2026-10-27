import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { PressableScale } from '@/components/pressable-scale';
import { ProgressBar } from '@/components/progress-bar';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import type { DeckStats } from '@/lib/session';
import type { Deck } from '@/store/types';

type DeckTileProps = {
  deck: Deck;
  stats: DeckStats;
  onPress: () => void;
  onManage: () => void;
};

export function DeckTile({ deck, stats, onPress, onManage }: DeckTileProps) {
  const { t, tn, languageName } = useTranslation();
  const complete = stats.cards > 0 && stats.learned === stats.cards;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={t('deckTile.learn', { name: deck.name })}
      onPress={onPress}
      onLongPress={onManage}
      style={[styles.tile, complete && styles.tileComplete]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {deck.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta} numberOfLines={1}>
              {languageName(deck.frontLang)}
            </Text>
            <Ionicons name="swap-horizontal" size={14} color={Colors.textMuted} />
            <Text style={styles.meta} numberOfLines={1}>
              {languageName(deck.backLang)}
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.meta}>{tn('count.cards', stats.cards)}</Text>
          </View>
        </View>
        <IconButton
          icon="ellipsis-horizontal"
          accessibilityLabel={t('deckTile.manage', { name: deck.name })}
          color={Colors.textSecondary}
          onPress={onManage}
        />
      </View>

      {stats.cards === 0 ? (
        <View style={styles.footer}>
          <Ionicons name="add-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.footerMuted}>{t('deckTile.noCards')}</Text>
        </View>
      ) : complete ? (
        <View style={styles.footer}>
          <View style={styles.doneBadge}>
            <Ionicons name="checkmark" size={14} color={Colors.success} />
            <Text style={styles.doneText}>{t('deckTile.completed')}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.footer}>
          <ProgressBar progress={stats.sidesDone / (stats.cards * 2)} style={styles.progress} />
          <Text style={styles.count}>
            {stats.learned}/{stats.cards}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.five,
    paddingRight: Spacing.four,
    gap: Spacing.five,
  },
  tileComplete: {
    borderColor: 'rgba(74, 222, 128, 0.25)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.one + 2,
  },
  name: {
    ...Type.title,
    fontSize: 21,
    lineHeight: 26,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  meta: {
    ...Type.caption,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  dot: {
    ...Type.caption,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 22,
    paddingRight: Spacing.one,
  },
  progress: {
    flex: 1,
  },
  count: {
    ...Type.caption,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  footerMuted: {
    ...Type.caption,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Colors.successSoft,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  doneText: {
    ...Type.caption,
    color: Colors.success,
  },
});
