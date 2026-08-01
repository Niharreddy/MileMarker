import React, { type PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/services/api";
import { AppThemeProvider } from "@/theme";

/**
 * Every cross-cutting provider the app needs, composed in one place and in
 * the order each library requires (gesture handler and safe-area context
 * must wrap everything else). `App.tsx` stays a two-line shell; this is
 * where a future provider (e.g. an auth context) gets added.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider>{children}</AppThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
