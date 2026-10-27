import { Platform, type TextStyle } from 'react-native';

/**
 * WordCards uses a single dark palette. Surfaces step up in brightness as they
 * get closer to the user, accents are used sparingly for actions and progress.
 */
export const Colors = {
  background: '#0B0C10',
  surface: '#14151B',
  surfaceRaised: '#1B1D24',
  surfacePressed: '#23252E',
  border: '#262833',
  borderStrong: '#343745',

  text: '#F3F4F7',
  textSecondary: '#A3A6B1',
  textMuted: '#686B78',

  accent: '#8E94FF',
  accentSoft: 'rgba(142, 148, 255, 0.14)',
  onAccent: '#0C0D14',

  success: '#4ADE80',
  successSoft: 'rgba(74, 222, 128, 0.14)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  warning: '#FBBF24',

  cardFront: '#191B22',
  cardBack: '#1C1E2D',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
  ten: 40,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

const fontFamily = Platform.select({ ios: 'System', default: undefined });

export const Type = {
  largeTitle: { fontFamily, fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontFamily, fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  headline: { fontFamily, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontFamily, fontSize: 16, lineHeight: 22, fontWeight: '400' },
  callout: { fontFamily, fontSize: 15, lineHeight: 20, fontWeight: '500' },
  caption: { fontFamily, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  overline: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export const MaxContentWidth = 640;
