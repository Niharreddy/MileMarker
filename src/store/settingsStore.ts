import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { StorageKeys } from "@/constants/storageKeys";
import { zustandMmkvStorage } from "@/services/storage";

export type ThemePreference = "system" | "light" | "dark";

export type SettingsState = {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

/**
 * User-configurable app preferences. Persisted to MMKV so choices like
 * theme survive app restarts. This is the example store demonstrating the
 * persisted-Zustand pattern; feature stores follow the same shape.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themePreference: "system",
      setThemePreference: (themePreference) => set({ themePreference }),
    }),
    {
      name: StorageKeys.settingsStore,
      storage: createJSONStorage(() => zustandMmkvStorage),
    }
  )
);
