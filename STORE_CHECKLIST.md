# Store submission checklist

Everything here is a manual step outside this repo — accounts, consoles,
and assets only you can create/own. Code-side config (`app.json`,
`eas.json`) is already in place; see `SUBMIT_SETUP.md` for the
credentials wiring.

## 1. Accounts

- [ ] Google Play Console developer account ($25 one-time) —
      https://play.google.com/console
- [ ] Apple Developer Program account ($99/year) —
      https://developer.apple.com

## 2. Privacy policy

- [ ] Host `PRIVACY.md`'s content somewhere with a public URL (GitHub
      Pages, a Notion public page, etc. all work).
- [ ] Fill in the "Last updated" date and contact email in `PRIVACY.md`
      before publishing it.
- [ ] Paste that URL into both Play Console (**App content → Privacy
      policy**) and App Store Connect (**App Privacy → Privacy Policy
      URL**).

## 3. Background location — the biggest review-risk item

Mile Marker requests `ACCESS_BACKGROUND_LOCATION` (for auto-detect and for
recording to survive being backgrounded). Both stores scrutinize this
heavily:

- [ ] **Play Console**: fill out the **Background Location** declaration
      form (App content section). You'll need to explain the core use case
      (automatic trip recording) and typically provide a short screen
      recording showing the permission request and the feature it powers.
      Apps that request this without a clearly justified, prominent
      in-app use get rejected — Mile Marker's permissions-priming screen
      already explains the "why" before asking, which helps, but the
      Play Console form itself still needs to be filled out explicitly.
- [ ] **App Store**: no separate form, but the app review notes (App Store
      Connect → your build → "Notes for Review") should briefly explain
      why background location is requested, to avoid a manual-review
      rejection/question.

## 4. Data Safety / App Privacy forms

- [ ] **Play Console → App content → Data safety**: declare Location
      (collected, used for app functionality, not shared), Photos
      (collected, used for app functionality, not shared). Answer "no" to
      data being sold/shared with third parties, and "yes" to data being
      deletable (uninstalling the app deletes it).
- [ ] **App Store Connect → App Privacy**: same shape — Location and
      Photos, both "used for app functionality," not linked to identity
      beyond the device, not used for tracking.

## 5. Assets

- [ ] Verify `src/assets/images/icon.png` is 1024×1024, no transparency —
      required for the App Store icon (EAS Build generates
      platform-specific icons from this one source at build time).
- [ ] Screenshots — both stores require at least one set per required
      device size:
  - Play Store: phone screenshots (min 2, JPG/PNG, 16:9 or 9:16).
  - App Store: 6.7" and 6.5" iPhone screenshots are the two currently
    required sizes (others optional/auto-scaled).
  - Take these from a real device/build, not the simulator's default
    chrome — capture Home (recording a trip), Trip Detail (route + photos
    + notes), and Memories.

## 6. Listing content

- [ ] Copy from `STORE_LISTING.md` into both consoles (edit as needed).
- [ ] Set the app category (Travel & Local / Travel, per
      `STORE_LISTING.md`).
- [ ] Content rating questionnaire (both stores) — Mile Marker has no
      user-generated content shared with others, no ads, no in-app
      purchases, so this should be the lowest-risk rating tier.

## 7. Before the actual submit

- [ ] Bump `app.json`'s `version` (currently `0.1.0`) if this is meant to
      be a real first release rather than a test.
- [ ] Confirm `eas.json`'s `submit.production` credentials are filled in
      (see `SUBMIT_SETUP.md`).
- [ ] Do one full manual pass on a real device build (not dev-client) —
      `eas-cli build --profile preview` — covering: start/stop a trip,
      auto-detect, photo pin (camera + gallery), mid-trip comment, export
      then import on a second device/reinstall, all four permission
      prompts (location, background location, photos, notifications).
