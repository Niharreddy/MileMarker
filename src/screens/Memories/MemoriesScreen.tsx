import React from "react";

import { AppHeader, AppText, ScreenContainer } from "@/components";

/** Notes/photos/ratings attached to locations. Placeholder until memory storage exists. */
export function MemoriesScreen() {
  return (
    <ScreenContainer>
      <AppHeader title="Memories" />
      <AppText color="secondary">Notes and photos you've saved will show up here.</AppText>
    </ScreenContainer>
  );
}
