import { LOCALE_TAGS, type Language } from '@/i18n/languages';
import de from '@/i18n/locales/de.json';
import en from '@/i18n/locales/en.json';
import ru from '@/i18n/locales/ru.json';
import { useSettingsStore } from '@/store/settings-store';

/**
 * Translations live in one flat JSON file per language (`locales/*.json`), with English as
 * the source of truth for the keys. Values are plain strings with `{param}` placeholders,
 * plural forms (`one` / `few` / `many` / `other`), or lists.
 */
type Source = typeof en;

type PluralForms = { one: string; few?: string; many?: string; other?: string };

type Dictionary = {
  [K in keyof Source]: Source[K] extends string
    ? string
    : Source[K] extends readonly (infer Item)[]
      ? Item[]
      : PluralForms;
};

type KeysWhere<Condition> = {
  [K in keyof Source]: Source[K] extends Condition ? K : never;
}[keyof Source];

export type TextKey = KeysWhere<string>;
export type PluralKey = KeysWhere<{ one: string }>;
export type ListKey = KeysWhere<readonly unknown[]>;

type Params = Record<string, string | number>;

// Typed as `Dictionary` so a missing key or wrong value shape in de/ru fails type checking.
const dictionaries: Record<Language, Dictionary> = { en, de, ru };

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

/** Languages suggested for a deck's two sides. Their names are translated (`languageName.*`). */
const CARD_LANGUAGES = ['ru', 'de', 'en', 'uk', 'fr', 'es'] as const;

type CardLanguage = (typeof CARD_LANGUAGES)[number];

const nameKey = (code: CardLanguage) => `languageName.${code}` as const;

// A deck stores its languages as typed text ("Russian", "Немецкий", …). Knowing the names in every
// UI language lets the app show them in the current one, whichever language the deck was made in.
const knownLanguageNames = new Map<string, CardLanguage>(
  Object.values(dictionaries).flatMap((dictionary) =>
    CARD_LANGUAGES.map((code) => [dictionary[nameKey(code)].toLocaleLowerCase(), code] as const)
  )
);

/** CLDR plural categories, reduced to what English, German and Russian need. */
function pluralCategory(language: Language, count: number): keyof PluralForms {
  if (language !== 'ru') return count === 1 ? 'one' : 'other';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'one';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few';
  return 'many';
}

function createTranslator(language: Language) {
  const dictionary = dictionaries[language];

  return {
    language,
    locale: LOCALE_TAGS[language],
    /** A plain string, with `{param}` placeholders filled in. */
    t: (key: TextKey, params?: Params) => interpolate(dictionary[key], params),
    /** A plural string; `{count}` is filled in automatically. */
    tn: (key: PluralKey, count: number, params?: Params) => {
      const forms = dictionary[key];
      const form = forms[pluralCategory(language, count)] ?? forms.other ?? forms.many ?? forms.one;
      return interpolate(form, { count, ...params });
    },
    list: <K extends ListKey>(key: K): Dictionary[K] => dictionary[key],
    /** A deck language in the UI language ("Russian" → "Русский"); unknown names stay as typed. */
    languageName: (name: string) => {
      const code = knownLanguageNames.get(name.trim().toLocaleLowerCase());
      return code ? dictionary[nameKey(code)] : name;
    },
    /** The suggested deck languages, named in the UI language. */
    languageSuggestions: () => CARD_LANGUAGES.map((code) => dictionary[nameKey(code)]),
  };
}

export type Translator = ReturnType<typeof createTranslator>;

const translators: Record<Language, Translator> = {
  en: createTranslator('en'),
  de: createTranslator('de'),
  ru: createTranslator('ru'),
};

export function useTranslation(): Translator {
  const language = useSettingsStore((state) => state.language);
  return translators[language];
}
