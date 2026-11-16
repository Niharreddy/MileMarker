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
  update. If the app process is killed mid-recording — or auto-detect starts
  a trip from a headless JS context while the app is closed — the unfinished
  trip resumes as the active trip on next launch (Stop Trip still works
  normally), instead of forcing a save/discard prompt on a trip the user
  never actually stopped.
- **Trips**: manual Start/Stop recording, plus automatic driving detection —
  an always-on background location subscription (when permission is granted
  and the Settings toggle is on) watches for sustained driving speed
  (~10 mph) and auto-starts a trip with a "Trip detected" popup, without
  triggering on walking. If a trip sits stationary for ~10 minutes, a popup
  asks whether to stop tracking instead of silently splitting the trip at
  every stop (e.g. a scenic viewpoint). Both moments also fire a real OS
  notification (not just the in-app popup), so they're noticed even while
  the app is backgrounded or the screen is off — requires notification
  permission, asked for on the permissions-priming screen. Live distance/duration/photo-count
  stats while recording, name + review form on stop (React Hook Form + Zod),
  search by name, and a detail screen with the route map, review, and
  photos — a "..." menu in that screen's header lets you permanently delete
  the trip (route, photos, and notes) with a confirmation prompt first.
  Distance is shown in miles or kilometers per the Settings toggle,
  auto-switching units as the number grows (ft→mi, m→km). Home also shows
  lifetime totals (trip count, total distance, total "memories" = photos +
  trips with a written review).
- **Photos**: a manual pin picker backed by the device gallery, with a
  "Take Photo" option at the top to shoot and attach a new photo on the
  spot, plus automatic geotag matching — after Stop Trip, gallery photos
  taken during the trip within ~150m of the recorded route are attached
  automatically (silently no-ops without gallery permission). Every pin
  photo (gallery, camera, or auto-matched) is copied into app-owned
  storage the moment it's attached, so it survives the original being
  deleted from your gallery — this is also what makes export/import work.
- **Mid-trip comments**: a second floating button next to the photo picker,
  visible whenever a trip is recording — drop a timestamped, geotagged
  comment at any point along the route (not just the single end-of-trip
  review). Comments show as tappable markers on the map and in a "Notes"
  section on the trip detail screen.
- **Export / Import**: Settings → Export Data serializes every past trip —
  routes, photos, notes, and reviews — into a single JSON file (photos
  embedded as base64) and hands it to the OS share sheet to save or send
  anywhere. Import picks a file back in, skipping any trip whose id
  already exists locally so re-importing the same file is a no-op.
- **Memories**: every photo pinned across every trip, flattened into one
  newest-first grid on the Memories tab; tapping a photo opens that trip's
  detail screen.
- **Map**: MapLibre with free OpenFreeMap styles (no API key) — the light
  "liberty" style, or the "dark" style when the app is in dark mode. Home is
  a full-bleed live map with search floating on top and a bottom panel
  (lifetime stats + Start Drive, or live recording stats + Stop Drive). The
  camera follows you until you pan or zoom by hand; a recenter button brings
  it back. Past routes get start/end markers and tappable photo pins.
- **Editing & sharing**: a saved drive or trip can be renamed and its
  review/description rewritten anytime from its detail screen. A drive’s
  route can be shared as a GPX file from its "..." menu.
- **Share summary**: the share button on a drive or trip builds one
  picture — a map of the route, headline stats, and up to four photos you
  pick — and hands it to the OS share sheet (Instagram, Messages, save to
  gallery). Uses `react-native-view-shot`, a native module, so it needs a
  fresh native build.
- **Stats**: a stats screen (from the Home panel or the Drives tab) with
  distance per month for the past year, current and longest driving-day
  streaks, and records (longest drive, most time behind the wheel, biggest
  month).
- **Photo locations**: a photo/video added to an already-saved drive or
  trip is only placed on the map if the file carries its own GPS metadata;
  otherwise it's attached with no location (it still shows in every photo
  grid). While a drive is recording, a photo with no metadata of its own
  is pinned at your current position.
- **Browsing**: the Drives tab is searchable (name, notes, trip) and
  sortable (newest / oldest / longest), grouped by month. Memories is
  grouped by month with an All / Photos / Videos filter and opens a
  full-screen, swipeable viewer that links back to the source drive or
  trip.
- **API layer**: a typed `apiClient` + React Query `queryClient`, wired into
  the provider tree but unused until a real feature needs the network.
- **Reusable components**: `AppText`, `AppButton`, `AppTextInput`,
  `AppSearchBar`, `ScreenContainer`, `LoadingIndicator`, `AppHeader`,
  `Card`, `StatRow`, `MetaItem`, `SectionHeader`, `SegmentedControl`,
  `EmptyState`, `AppDialog`, `EditDetailsDialog`.

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

## Store submission

See `SUBMIT_SETUP.md` for wiring up EAS submit credentials, and
`STORE_CHECKLIST.md` for the full manual checklist (accounts, privacy
policy hosting, screenshots, background-location declaration). Draft
listing copy is in `STORE_LISTING.md`, draft privacy policy in
`PRIVACY.md`.

## Next up

- Smarter activity recognition (native motion APIs) for more accurate
  driving vs. walking/cycling detection
