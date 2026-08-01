import { useColorScheme as useSystemColorScheme } from "react-native";

import { useSettingsStore } from "@/store/settingsStore";

export type ResolvedColorScheme = "light" | "dark";

/**
 * Resolves the effective color scheme by combining the OS setting with the
 * user's in-app override (`settingsStore.themePreference`). This is the
 * single source of truth `ThemeProvider` and `RootNavigator` both read, so
 * Paper theming and React Navigation theming never drift apart.
 */
export function useAppColorScheme(): ResolvedColorScheme {
  const systemScheme = useSystemColorScheme();
  const preference = useSettingsStore((state) => state.themePreference);

  if (preference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return preference;
}
