# Mile Marker

Private, offline-first mobile app for recording the roads you drive and
attaching memories, notes, ratings, and photos to places along the way.

## What's here

- **Expo (React Native + TypeScript)**, using the dev-client + prebuild
  workflow (several dependencies — Reanimated, Gesture Handler, MMKV,
  MapLibre, SQLite — need native code, so this won't run in plain Expo Go).
- **Navigation**: bottom tabs (Home, Trips, Memories, Settings) wrapped in a
  root stack, so screens like Trip Detail can push over the tabs with a
  native back button. A welcome screen gates entry on every launch, followed
  by a one-time permissions-priming screen (location, background location,
  gallery) that auto-skips itself once every permission already has a real
  answer.
- **Theme**: centralized colors/spacing/typography/radii, warm
  terracotta/cream travel-app palette, light + dark mode, driving both
  react-native-paper and React Navigation. App icon, Android adaptive icon,
  and splash screen are a generated road-and-pin graphic in the same palette
  (`src/assets/images`) — changing these requires a fresh native build, not
  just a Metro reload.
- **State**: Zustand (`appStore`; `settingsStore` — theme, distance units,
  auto-detect toggle — persisted to MMKV; `tripStore` for in-progress/past
  trips, backed by SQLite so it's just a live view over the database, not
  the source of truth itself).
- **Persistence**: SQLite (`src/services/db`, `expo-sqlite`) stores trips,
  route points, and photo pins durably on-device. The active trip id is also
  kept in MMKV so the background location task can write points straight to
  SQLite even when the OS relaunches a fresh, empty JS context to deliver an
  update. If the app process is killed mid-recording, the unfinished trip is
  recovered on next launch and surfaced for you to name/save rather than
  lost or silently resumed.
- **Trips**: manual Start/Stop recording, plus automatic driving detection —
  an always-on background location subscription (when permission is granted
  and the Settings toggle is on) watches for sustained driving speed
  (~10 mph) and auto-starts a trip with a "Trip detected" popup, without
  triggering on walking. If a trip sits stationary for ~10 minutes, a popup
  asks whether to stop tracking instead of silently splitting the trip at
  every stop (e.g. a scenic viewpoint). Live distance/duration/photo-count
  stats while recording, name + review form on stop (React Hook Form + Zod),
  search by name, and a detail screen with the route map, review, and
  photos. Distance is shown in miles or kilometers per the Settings toggle,
  auto-switching units as the number grows (ft→mi, m→km). Home also shows
  lifetime totals (trip count, total distance, total "memories" = photos +
  trips with a written review).
- **Photos**: a manual pin picker backed by the device gallery, with a
  "Take Photo" option at the top to shoot and attach a new photo on the
  spot, plus automatic geotag matching — after Stop Trip, gallery photos
  taken during the trip within ~150m of the recorded route are attached
  automatically (silently no-ops without gallery permission).
- **Memories**: every photo pinned across every trip, flattened into one
  newest-first grid on the Memories tab; tapping a photo opens that trip's
  detail screen.
- **Map**: MapLibre with a free OpenFreeMap street style (no API key). Home
  shows a large, flexible-height map with floating Start/Stop Trip and Past
  Trips buttons anchored just beneath it.
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

- Driving detection is speed-only (GPS fixes, no motion/activity-recognition
  API), so it can't perfectly tell driving apart from e.g. sustained
  cycling — thresholds are tuned conservatively to avoid false-triggering on
  walking, at the cost of occasionally missing very slow/stop-and-go driving.
- With auto-detect on, the background location subscription runs
  continuously (not just during a trip), which means a persistent Android
  notification and higher background battery use than trip-only tracking —
  by design, since Android requires it for standing background location
  access. Turn auto-detect off in Settings to fall back to tracking only
  while a manually-started trip is active.
- Map tiles need connectivity; GPS recording itself doesn't.

## Next up

- GPX/route export
- Smarter activity recognition (native motion APIs) for more accurate
  driving vs. walking/cycling detection
