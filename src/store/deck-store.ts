import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createId } from '@/lib/id';
import type { Card, CardInput, Deck, DeckInput, DeckProgress, Side } from '@/store/types';

type DeckState = {
  decks: Deck[];
  /** Per deck, per card: on which learning day each side was last completed. */
  progress: Record<string, DeckProgress>;
};

type DeckActions = {
  createDeck: (input: DeckInput) => string;
  updateDeck: (id: string, input: DeckInput) => void;
  deleteDeck: (id: string) => void;
  touchDeck: (id: string) => void;
  addCard: (deckId: string, input: CardInput) => string;
  updateCard: (deckId: string, cardId: string, input: CardInput) => void;
  deleteCard: (deckId: string, cardId: string) => void;
  markLearned: (deckId: string, cardId: string, side: Side, day: string) => void;
  resetProgress: (deckId: string) => void;
};

function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

function cleanDeck(input: DeckInput): DeckInput {
  return {
    name: input.name.trim(),
    frontLang: input.frontLang.trim(),
    backLang: input.backLang.trim(),
  };
}

function cleanCard(input: CardInput): CardInput {
  return {
    front: input.front.trim(),
    back: input.back.trim(),
    example: input.example.trim(),
  };
}

function updateDeckIn(decks: Deck[], id: string, update: (deck: Deck) => Deck): Deck[] {
  return decks.map((deck) => (deck.id === id ? update(deck) : deck));
}

export const useDeckStore = create<DeckState & DeckActions>()(
  persist(
    (set) => ({
      decks: [],
      progress: {},

      createDeck: (input) => {
        const now = Date.now();
        const deck: Deck = {
          id: createId(),
          ...cleanDeck(input),
          cards: [],
          createdAt: now,
          lastUsedAt: now,
        };
        set((state) => ({ decks: [deck, ...state.decks] }));
        return deck.id;
      },

      updateDeck: (id, input) =>
        set((state) => ({
          decks: updateDeckIn(state.decks, id, (deck) => ({
            ...deck,
            ...cleanDeck(input),
            lastUsedAt: Date.now(),
          })),
        })),

      deleteDeck: (id) =>
        set((state) => ({
          decks: state.decks.filter((deck) => deck.id !== id),
          progress: omit(state.progress, id),
        })),

      touchDeck: (id) =>
        set((state) => ({
          decks: updateDeckIn(state.decks, id, (deck) => ({ ...deck, lastUsedAt: Date.now() })),
        })),

      addCard: (deckId, input) => {
        const card: Card = { id: createId(), ...cleanCard(input), createdAt: Date.now() };
        set((state) => ({
          decks: updateDeckIn(state.decks, deckId, (deck) => ({
            ...deck,
            cards: [...deck.cards, card],
            lastUsedAt: Date.now(),
          })),
        }));
        return card.id;
      },

      updateCard: (deckId, cardId, input) =>
        set((state) => ({
          decks: updateDeckIn(state.decks, deckId, (deck) => ({
            ...deck,
            cards: deck.cards.map((card) =>
              card.id === cardId ? { ...card, ...cleanCard(input) } : card
            ),
          })),
        })),

      deleteCard: (deckId, cardId) =>
        set((state) => ({
          decks: updateDeckIn(state.decks, deckId, (deck) => ({
            ...deck,
            cards: deck.cards.filter((card) => card.id !== cardId),
          })),
          progress: {
            ...state.progress,
            [deckId]: omit(state.progress[deckId] ?? {}, cardId),
          },
        })),

      markLearned: (deckId, cardId, side, day) =>
        set((state) => {
          const deckProgress = state.progress[deckId] ?? {};
          return {
            progress: {
              ...state.progress,
              [deckId]: {
                ...deckProgress,
                [cardId]: { ...deckProgress[cardId], [side]: day },
              },
            },
          };
        }),

      resetProgress: (deckId) => set((state) => ({ progress: omit(state.progress, deckId) })),
    }),
    {
      name: 'wordcards',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ decks: state.decks, progress: state.progress }),
    }
  )
);

export function useDeck(id: string | undefined): Deck | undefined {
  return useDeckStore((state) => state.decks.find((deck) => deck.id === id));
}

const EMPTY_PROGRESS: DeckProgress = {};

export function useDeckProgress(id: string | undefined): DeckProgress {
  return useDeckStore((state) => (id && state.progress[id]) || EMPTY_PROGRESS);
}
