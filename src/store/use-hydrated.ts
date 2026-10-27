import { useSyncExternalStore } from 'react';

import { useDeckStore } from '@/store/deck-store';
import { useSettingsStore } from '@/store/settings-store';

const persistedStores = [useDeckStore, useSettingsStore];

function subscribe(onChange: () => void) {
  const unsubscribers = persistedStores.map((store) => store.persist.onFinishHydration(onChange));
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

function allHydrated() {
  return persistedStores.every((store) => store.persist.hasHydrated());
}

/** True once decks, progress and settings have been loaded from device storage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, allHydrated);
}
