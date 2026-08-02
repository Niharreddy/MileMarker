/** Params for each bottom-tab route. */
export type RootTabParamList = {
  Home: undefined;
  Trips: undefined;
  Memories: undefined;
  Settings: undefined;
};

/**
 * Top-level stack wrapping the tab navigator, so screens that need to
 * appear over the tabs (currently just TripDetail) can be pushed from
 * anywhere — a search result on Home, or a row on the Trips tab.
 */
export type RootStackParamList = {
  Main: undefined;
  TripDetail: { tripId: string };
};

// Merges both param lists into one namespace so `useNavigation()`/`navigate()`
// type-check app-wide without re-specifying a generic at every call site —
// React Navigation bubbles `navigate()` calls up to whichever ancestor
// navigator actually owns the route name.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList, RootStackParamList {}
  }
}
