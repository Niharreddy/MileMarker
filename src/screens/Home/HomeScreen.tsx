import React from "react";

import { AppHeader, AppText, ScreenContainer } from "@/components";

/**
 * Map tab root. Will host the live map + "roads you've driven" view once
 * GPS tracking and MapLibre are wired up in a later phase — placeholder
 * only for now.
 */
export function HomeScreen() {
  return (
    <ScreenContainer>
      <AppHeader title="Home" />
      <AppText color="secondary">Your map will live here.</AppText>
    </ScreenContainer>
  );
}
