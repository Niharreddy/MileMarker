import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";

import { useAppColorScheme } from "@/hooks";
import { WelcomeScreen } from "@/screens/Welcome";
import { navigationDarkTheme, navigationLightTheme } from "@/theme";

import { RootStack } from "./RootStack";

/**
 * Owns the NavigationContainer and picks the matching light/dark navigation
 * theme via the same `useAppColorScheme` hook `AppThemeProvider` uses, so
 * screen backgrounds and the tab bar never flash the wrong theme.
 *
 * `hasStarted` is plain component state, not persisted — the welcome screen
 * is meant to appear on every cold start, not just the first ever launch.
 */
export function RootNavigator() {
  const scheme = useAppColorScheme();
  const [hasStarted, setHasStarted] = useState(false);

  if (!hasStarted) {
    return <WelcomeScreen onGetStarted={() => setHasStarted(true)} />;
  }

  return (
    <NavigationContainer theme={scheme === "dark" ? navigationDarkTheme : navigationLightTheme}>
      <RootStack />
    </NavigationContainer>
  );
}
