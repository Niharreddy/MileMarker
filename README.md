# RoadMemo — Phase 1

Private, offline-first mobile app for recording the roads you drive and
attaching memories, notes, ratings, and photos to places along the way.

This is **Phase 1**: project foundation only. No GPS tracking, no local
database, no map rendering, no business logic. The goal is a clean,
scalable base to build every later phase on top of.

## What's here

- **Expo (React Native + TypeScript)**, using the dev-client + prebuild
  workflow (several dependencies — Reanimated, Gesture Handler, MMKV — need
  native code, so this won't run in plain Expo Go).
- **Navigation**: bottom tabs — Home, Trips, Memories, Settings — each a
  placeholder screen.
- **Theme**: centralized colors/spacing/typography/radii, light + dark
  mode, driving both react-native-paper and React Navigation.
- **State**: Zustand (`appStore`, `settingsStore`), with `settingsStore`
  persisted to MMKV.
- **API layer**: a typed `apiClient` + React Query `queryClient`, wired into
  the provider tree but unused until a real feature needs the network.
- **Reusable components**: `AppText`, `AppButton`, `ScreenContainer`,
  `LoadingIndicator`, `AppHeader`.

See `src/` for the full folder structure; each top-level folder has a
one-line purpose in the project's architecture writeup.

## Running it

```bash
npm install
npx expo prebuild --clean   # regenerates android/ and ios/ (gitignored)
npx expo run:android        # or: npx expo run:ios
```

Or, once a dev-client build is installed on your device/simulator:

```bash
npm run start
```

## Legacy prototype

`legacy/` contains an earlier working prototype (GPS tracking, SQLite,
MapLibre map, photo geotagging) built before this architecture existed. It's
not wired into the app — kept for reference when those features are
re-implemented against the new `src/` structure. See `legacy/README.md`.

## Next up (Phase 2 candidates)

- SQLite-backed local storage abstraction
- Background GPS trip recording
- MapLibre map rendering
- Trip list / history, memory creation flow
