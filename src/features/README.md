# Features

Feature-based folders for anything with real business logic — no longer
empty now that `map` (location/permissions/map rendering) and `trips`
(trip recording/history) exist. Structure for a feature folder:

```
src/features/trips/
  api/          # queries/mutations for this feature (React Query hooks)
  components/   # components used only within this feature
  store/        # feature-local Zustand store, if needed
  hooks/        # feature-local hooks
  types.ts
  index.ts      # public exports — other features/screens import only from here
```

Rules of thumb:
- Cross-cutting UI (buttons, text, headers) stays in `src/components`, not
  duplicated per feature.
- A feature should not import another feature's internals — only its
  `index.ts` barrel. `trips` imports `Coordinates`/`Pin` from `map`'s barrel,
  for example, never from `map/types.ts` directly.
- If something is used by two or more features, it belongs in
  `src/services`, `src/store`, or `src/hooks` instead of a feature folder.

Still to come: `memories` (notes/ratings/photos browsed independent of a
trip, once local storage exists).
