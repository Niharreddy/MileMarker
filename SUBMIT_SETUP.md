# Store submission setup

`eas.json`'s `submit.production` block has placeholder values — replace
them before running `eas submit`, which is a manual step you run yourself
(not something run automatically as part of this repo's tooling).

## Android (Play Console)

1. Create a Google Play Console developer account ($25 one-time) at
   https://play.google.com/console if you don't have one.
2. Create the app listing there first (package name `com.milemarker.myapp`,
   matching `app.json`'s `android.package`) — EAS submit uploads a build to
   an existing listing, it doesn't create one.
3. In Play Console: **Setup → API access** → create a service account,
   grant it "Release manager" access, download its JSON key.
4. Save that file as `google-play-service-account.json` in the project
   root (already gitignored — never commit it).
5. `eas.json`'s `submit.production.android.track` is set to `"internal"`
   (the lowest-friction track — internal testers only, no review). Change
   to `"production"` once you're ready for a public release/review.

## iOS (App Store Connect)

1. Create an Apple Developer Program account ($99/year) at
   https://developer.apple.com if you don't have one.
2. Create the app listing in App Store Connect (bundle id
   `com.milemarker.myapp`, matching `app.json`'s `ios.bundleIdentifier`).
3. Replace the three placeholders in `eas.json`:
   - `appleId` — your Apple Developer account email.
   - `ascAppId` — the numeric App Store Connect app id (App Store Connect →
     your app → App Information → "Apple ID" field, despite the confusing
     name it's a number like `1234567890`, not your email).
   - `appleTeamId` — found at https://developer.apple.com/account under
     Membership Details.

## Then

```bash
npx eas-cli build --profile production --platform android
npx eas-cli submit --profile production --platform android
```
(and the equivalent `--platform ios` commands once the Apple side is set
up). Both need `PRIVACY.md` hosted somewhere with a public URL first — see
`STORE_CHECKLIST.md`.
