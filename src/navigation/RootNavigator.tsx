import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import { useAppColorScheme } from "@/hooks";
import { navigationDarkTheme, navigationLightTheme } from "@/theme";

import { BottomTabNavigator } from "./BottomTabNavigator";

/**
 * Owns the NavigationContainer and picks the matching light/dark navigation
 * theme via the same `useAppColorScheme` hook `AppThemeProvider` uses, so
 * screen backgrounds and the tab bar never flash the wrong theme. This is
 * the one place a future stack-based auth flow or modal root would be
 * added alongside `BottomTabNavigator`.
 */
export function RootNavigator() {
  const scheme = useAppColorScheme();

  return (
    <NavigationContainer theme={scheme === "dark" ? navigationDarkTheme : navigationLightTheme}>
      <BottomTabNavigator />
    </NavigationContainer>
  );
}
