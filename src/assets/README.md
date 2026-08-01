# Assets

Static assets (images, fonts, Lottie files) live here, grouped by kind:

```
src/assets/
  images/
  fonts/
```

Nothing is here yet in Phase 1. When custom fonts are added, register them
in `theme/typography.ts` (the `fontFamily` values) and load them via
`expo-font` before rendering `App`, rather than referencing font files
directly from screens/components.
