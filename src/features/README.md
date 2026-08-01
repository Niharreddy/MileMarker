# Features

This folder is intentionally empty in Phase 1 — no feature has business
logic yet. When a feature (trips, memories, GPS tracking, ...) gains real
behavior, it gets its own folder here, structured like:

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
  `index.ts` barrel.
- If something is used by two or more features, it belongs in
  `src/services`, `src/store`, or `src/hooks` instead of a feature folder.

Anticipated first features: `trips` (GPS recording/history), `memories`
(notes/photos/ratings attached to locations), `map` (MapLibre rendering).
