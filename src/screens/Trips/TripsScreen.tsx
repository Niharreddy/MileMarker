import React from "react";

import { AppHeader, AppText, ScreenContainer } from "@/components";

/** List of recorded trips. Placeholder until trip storage/history exists. */
export function TripsScreen() {
  return (
    <ScreenContainer>
      <AppHeader title="Trips" />
      <AppText color="secondary">Your recorded trips will show up here.</AppText>
    </ScreenContainer>
  );
}
