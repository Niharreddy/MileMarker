# Mile Marker

Private, offline-first mobile app for recording the roads you drive and
attaching memories, notes, ratings, and photos to places along the way.

## What's here

- **Expo (React Native + TypeScript)**, using the dev-client + prebuild
  workflow (several dependencies — Reanimated, Gesture Handler, MMKV,
  MapLibre — need native code, so this won't run in plain Expo Go).
- **Navigation**: bottom tabs (Home, Trips, Memories, Settings) wrapped in a
  root stack, so screens like Trip Detail can push over the tabs with a
  native back button. A welcome screen gates entry on every launch.
- **Theme**: centralized colors/spacing/typography/radii, warm travel-app
  palette, light + dark mode, driving both react-native-paper and React
  Navigation.
- **State**: Zustand (`appStore`, `settingsStore` persisted to MMKV,
  `tripStore` for in-progress/past trips — all trip data is in-memory only
  for now and resets on app restart; no local database yet).
- **Trips**: start/stop recording with background location tracking
  (foreground-service notification + `expo-task-manager` headless task, with
  graceful fallback to foreground-only polling if background permission is
  denied), live distance/duration stats while recording, name + review form
  on stop (React Hook Form + Zod), search by name, and a detail screen with
  the route map, review, and photos.
- **Map**: MapLibre with a free OpenFreeMap street style (no API key), a
  photo-pin picker backed by the device gallery.
- **API layer**: a typed `apiClient` + React Query `queryClient`, wired into
  the provider tree but unused until a real feature needs the network.
- **Reusable components**: `AppText`, `AppButton`, `AppTextInput`,
  `AppSearchBar`, `ScreenContainer`, `LoadingIndicator`, `AppHeader`.

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

For a standalone build you can install and use without Metro running
(e.g. to actually drive around with it):

```bash
npx eas-cli build --profile preview --platform android
```

## Known limitations

- All trip/pin/settings data is in-memory or MMKV-only — nothing is in a
  real database yet, so trips don't survive an app process being killed by
  the OS in the background (the foreground-service notification makes this
  less likely, not impossible).
- Map tiles need connectivity; GPS recording itself doesn't.

## Next up

- Persist trips/pins to local storage (SQLite) so recording survives a
  killed process and app restarts
- Memories tab (browse notes/photos independent of a specific trip)
- GPX/route export
