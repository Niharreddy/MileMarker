import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";

import { AutoTripDetection } from "@/features/trips";
import { useAppColorScheme } from "@/hooks";
import { PermissionsPrimingScreen } from "@/screens/PermissionsPriming";
import { WelcomeScreen } from "@/screens/Welcome";
import { navigationDarkTheme, navigationLightTheme } from "@/theme";

import { RootStack } from "./RootStack";

/**
 * Owns the NavigationContainer and picks the matching light/dark navigation
 * theme via the same `useAppColorScheme` hook `AppThemeProvider` uses, so
 * screen backgrounds and the tab bar never flash the wrong theme.
 *
 * `hasStarted` and `permissionsReady` are plain component state, not
 * persisted — the welcome screen is meant to appear on every cold start,
 * and the permissions screen re-mounts every launch too but auto-skips
 * itself once every permission already has a real answer (see
 * `PermissionsPrimingScreen`), so in practice it's only ever actually
 * shown to the user once.
 */
export function RootNavigator() {
  const scheme = useAppColorScheme();
  const [hasStarted, setHasStarted] = useState(false);
  const [permissionsReady, setPermissionsReady] = useState(false);

  if (!hasStarted) {
    return <WelcomeScreen onGetStarted={() => setHasStarted(true)} />;
  }

  if (!permissionsReady) {
    return <PermissionsPrimingScreen onDone={() => setPermissionsReady(true)} />;
  }

  return (
    <>
      <NavigationContainer theme={scheme === "dark" ? navigationDarkTheme : navigationLightTheme}>
        <RootStack />
      </NavigationContainer>
      <AutoTripDetection />
    </>
  );
}
