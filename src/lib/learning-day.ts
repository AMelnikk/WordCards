import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Completed cards stay completed for one "learning day". The day rolls over at
 * 4 AM local time instead of midnight, so a late-night session still counts
 * for the evening it started in, and the cards come back the next day.
 */
export const DAY_START_HOUR = 4;

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

export function learningDayKey(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() - DAY_START_HOUR * 60 * 60 * 1000);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
}

/** Current learning day, refreshed whenever the app comes back to the foreground. */
export function useLearningDay(): string {
  const [day, setDay] = useState(learningDayKey);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setDay(learningDayKey());
    });
    return () => subscription.remove();
  }, []);

  return day;
}
