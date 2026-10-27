export type Card = {
  id: string;
  /** Meaning, written in the deck's front language (e.g. Russian). */
  front: string;
  /** Translation, written in the deck's back language (e.g. German). */
  back: string;
  example: string;
  createdAt: number;
};

export type Deck = {
  id: string;
  name: string;
  frontLang: string;
  backLang: string;
  cards: Card[];
  createdAt: number;
  /** Updated when the deck is created, edited or studied; drives the home order. */
  lastUsedAt: number;
};

/** Which side of a card is shown first. Each card is learned from both sides. */
export type Side = 'front' | 'back';

/** Learning day keys on which each direction of a card was last answered correctly. */
export type CardProgress = Partial<Record<Side, string>>;

export type DeckProgress = Record<string, CardProgress>;

export type DeckInput = Pick<Deck, 'name' | 'frontLang' | 'backLang'>;

export type CardInput = Pick<Card, 'front' | 'back' | 'example'>;
