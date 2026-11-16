import React, { type PropsWithChildren } from "react";
import { StatusBar } from "react-native";
import { PaperProvider } from "react-native-paper";

import { useAppColorScheme } from "@/hooks";

import { darkTheme, lightTheme } from "./theme";

/**
 * Resolves light/dark from `useAppColorScheme` and feeds the matching theme
 * into react-native-paper's provider. `RootNavigator` reads the same hook
 * to pick its navigation theme, so Paper and React Navigation always agree
 * on light/dark.
 */
export function AppThemeProvider({ children }: PropsWithChildren) {
  const scheme = useAppColorScheme();
  const theme = scheme === "dark" ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      {/* Icon color only — no `translucent`/background, so native-stack headers keep their own status-bar inset handling. */}
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
      {children}
    </PaperProvider>
  );
}
