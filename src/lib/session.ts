import { createId } from '@/lib/id';
import type { Card, Deck, DeckProgress, Side } from '@/store/types';

export const SIDES: readonly Side[] = ['front', 'back'];

/** One showing of a card. `key` is unique per entry so React can track it across the stack. */
export type QueueItem = {
  key: string;
  cardId: string;
  side: Side;
};

export type DeckStats = {
  cards: number;
  /** Cards completed from both sides today. */
  learned: number;
  /** Individual sides completed today (two per card). */
  sidesDone: number;
};

export function isSideDone(progress: DeckProgress, cardId: string, side: Side, day: string) {
  return progress[cardId]?.[side] === day;
}

export function getDeckStats(deck: Deck, progress: DeckProgress, day: string): DeckStats {
  let learned = 0;
  let sidesDone = 0;
  for (const card of deck.cards) {
    const done = SIDES.filter((side) => isSideDone(progress, card.id, side, day)).length;
    sidesDone += done;
    if (done === SIDES.length) learned += 1;
  }
  return { cards: deck.cards.length, learned, sidesDone };
}

function pendingItems(cards: Card[], progress: DeckProgress, day: string): QueueItem[] {
  return cards.flatMap((card) =>
    SIDES.filter((side) => !isSideDone(progress, card.id, side, day)).map((side) => ({
      key: createId(),
      cardId: card.id,
      side,
    }))
  );
}

/** How often two consecutive items show the same card (`previousCardId` is what's on screen now). */
export function countRepeats(items: QueueItem[], previousCardId?: string): number {
  let repeats = 0;
  let last = previousCardId;
  for (const item of items) {
    if (item.cardId === last) repeats += 1;
    last = item.cardId;
  }
  return repeats;
}

function pickRandom<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

/**
 * One random ordering, built item by item. Each step skips the card that was just placed and,
 * when possible, the one before it too, so the two sides of a word end up well apart.
 */
function randomOrder(items: QueueItem[], previousCardId?: string): QueueItem[] {
  const remaining = [...items];
  const result: QueueItem[] = [];
  const recent = previousCardId ? [previousCardId] : [];

  while (remaining.length > 0) {
    const indices = remaining.map((_, index) => index);
    const notRecent = indices.filter((index) => !recent.includes(remaining[index].cardId));
    const notLast = indices.filter((index) => remaining[index].cardId !== recent.at(-1));
    const index = pickRandom(
      notRecent.length > 0 ? notRecent : notLast.length > 0 ? notLast : indices
    );
    const [item] = remaining.splice(index, 1);
    result.push(item);
    recent.push(item.cardId);
    if (recent.length > 2) recent.shift();
  }
  return result;
}

const ORDER_ATTEMPTS = 40;

/**
 * Random order in which the two sides of a card are never shown back to back. Building greedily
 * can paint itself into a corner (only one card's two sides left), so it retries and keeps the
 * best attempt; a repeat only survives when it can't be avoided, e.g. a deck with one card.
 */
export function arrange(items: QueueItem[], previousCardId?: string): QueueItem[] {
  let best = items;
  let bestRepeats = Infinity;
  for (let attempt = 0; attempt < ORDER_ATTEMPTS && bestRepeats > 0; attempt++) {
    const order = randomOrder(items, previousCardId);
    const repeats = countRepeats(order, previousCardId);
    if (repeats < bestRepeats) {
      best = order;
      bestRepeats = repeats;
    }
  }
  return best;
}

export function buildQueue(deck: Deck, progress: DeckProgress, day: string): QueueItem[] {
  return arrange(pendingItems(deck.cards, progress, day));
}

/**
 * Keeps the running queue in sync after the deck was edited mid-session: drops deleted cards
 * and mixes in sides of newly added ones. The card on top stays put, since it may be on screen.
 */
export function syncQueue(
  queue: QueueItem[],
  deck: Deck,
  progress: DeckProgress,
  day: string
): QueueItem[] {
  const cardIds = new Set(deck.cards.map((card) => card.id));
  const kept = queue.filter((item) => cardIds.has(item.cardId));
  const queued = new Set(kept.map((item) => `${item.cardId}:${item.side}`));
  const added = pendingItems(deck.cards, progress, day).filter(
    (item) => !queued.has(`${item.cardId}:${item.side}`)
  );
  if (added.length === 0 && kept.length === queue.length) return queue;

  const [top, ...rest] = kept;
  if (!top) return arrange(added);
  const merged = [...rest, ...added];
  // Removing cards can leave two sides of the same word next to each other; only then reorder.
  if (added.length === 0 && countRepeats(merged, top.cardId) === 0) return kept;
  return [top, ...arrange(merged, top.cardId)];
}

/**
 * Reorders the queue if it would show a card twice in a row. Keeps the first card when possible,
 * since it is already visible behind the card that was just answered.
 */
function repair(queue: QueueItem[], previousCardId: string): QueueItem[] {
  if (countRepeats(queue, previousCardId) === 0) return queue;
  const reordered = arrange(queue, previousCardId);
  const [first, ...rest] = queue;
  if (first.cardId === previousCardId) return reordered;
  const keepingFirst = [first, ...arrange(rest, first.cardId)];
  return countRepeats(keepingFirst, previousCardId) <= countRepeats(reordered, previousCardId)
    ? keepingFirst
    : reordered;
}

/** The queue after answering its top card: gone when known, a few cards further back otherwise. */
export function advance(queue: QueueItem[], item: QueueItem, known: boolean): QueueItem[] {
  const rest = queue.filter((entry) => entry.key !== item.key);
  return repair(known ? rest : requeue(rest, item), item.cardId);
}

/**
 * A card answered with "again" comes back a few cards later, not at the very end, and never
 * right next to its other side. `rest` is the queue without the card that was just answered.
 */
function requeue(rest: QueueItem[], item: QueueItem): QueueItem[] {
  const fits = (index: number) =>
    (index === 0 ? item.cardId : rest[index - 1].cardId) !== item.cardId &&
    rest[index]?.cardId !== item.cardId;

  const again = { ...item, key: createId() };
  const target = Math.min(rest.length, 3 + Math.floor(Math.random() * 3));
  const candidates = [
    ...Array.from({ length: rest.length - target + 1 }, (_, i) => target + i),
    ...Array.from({ length: target - 1 }, (_, i) => target - 1 - i),
  ];
  const index = candidates.find(fits);
  if (index === undefined) return arrange([...rest, again], item.cardId);
  return [...rest.slice(0, index), again, ...rest.slice(index)];
}
