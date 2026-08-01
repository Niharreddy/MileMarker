/**
 * Params for each bottom-tab route. Every tab is a top-level screen with no
 * params today; when a tab grows its own stack (e.g. Trips -> TripDetail),
 * nest a stack navigator under that tab rather than adding params here.
 */
export type RootTabParamList = {
  Home: undefined;
  Trips: undefined;
  Memories: undefined;
  Settings: undefined;
};

// Lets `useNavigation()` / `useRoute()` infer types app-wide without
// re-specifying `RootTabParamList` as a generic at every call site.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
