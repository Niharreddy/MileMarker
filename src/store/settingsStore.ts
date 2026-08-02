import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { StorageKeys } from "@/constants/storageKeys";
import { zustandMmkvStorage } from "@/services/storage";

export type ThemePreference = "system" | "light" | "dark";
export type UnitPreference = "metric" | "imperial";

export type SettingsState = {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  unitPreference: UnitPreference;
  setUnitPreference: (preference: UnitPreference) => void;
  /** When on, driving is detected automatically (even with the app closed) and starts a trip without a manual tap. */
  autoDetectDrivingEnabled: boolean;
  setAutoDetectDrivingEnabled: (enabled: boolean) => void;
};

/**
 * User-configurable app preferences. Persisted to MMKV so choices like
 * theme/units survive app restarts. This is the example store demonstrating
 * the persisted-Zustand pattern; feature stores follow the same shape.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themePreference: "system",
      setThemePreference: (themePreference) => set({ themePreference }),
      unitPreference: "metric",
      setUnitPreference: (unitPreference) => set({ unitPreference }),
      autoDetectDrivingEnabled: true,
      setAutoDetectDrivingEnabled: (autoDetectDrivingEnabled) => set({ autoDetectDrivingEnabled }),
    }),
    {
      name: StorageKeys.settingsStore,
      storage: createJSONStorage(() => zustandMmkvStorage),
    }
  )
);
