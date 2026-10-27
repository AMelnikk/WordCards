import { getLocales } from 'expo-localization';

/** UI languages, in the order the switch on the home screen cycles through them. */
export const LANGUAGES = ['en', 'de', 'ru'] as const;

export type Language = (typeof LANGUAGES)[number];

/** BCP 47 tags used for date formatting. */
export const LOCALE_TAGS: Record<Language, string> = {
  en: 'en-GB',
  de: 'de-DE',
  ru: 'ru-RU',
};

function isLanguage(value: string | null | undefined): value is Language {
  return LANGUAGES.includes(value as Language);
}

/** The first of the device's preferred languages the app supports, falling back to English. */
export function detectLanguage(): Language {
  const match = getLocales().find((locale) => isLanguage(locale.languageCode));
  return isLanguage(match?.languageCode) ? match.languageCode : 'en';
}

export function nextLanguage(language: Language): Language {
  return LANGUAGES[(LANGUAGES.indexOf(language) + 1) % LANGUAGES.length];
}
