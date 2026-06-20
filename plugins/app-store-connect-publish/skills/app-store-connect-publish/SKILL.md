---
name: app-store-connect-publish
description: >-
  Non-obvious facts for automating App Store Connect listing management:
  which pieces of the listing can be set programmatically and which can't.
  Use when uploading metadata, App Privacy ("nutrition") labels, Accessibility
  Nutrition Labels, or the Age Rating questionnaire as code. Triggers:
  "App Privacy labels", "accessibility nutrition labels", "age rating",
  "fastlane deliver", "eas submit metadata".
---

# App Store Connect: what's automatable (the non-obvious split)

The instinct "the store listing must be done by hand in the web UI" is wrong,
and the exceptions are easy to get backwards. Only the surprising facts are here.

## The gotchas (verified 2026-06)

- **App Privacy labels are NOT done by `deliver`.** They have a separate fastlane
  action: `upload_app_privacy_details_to_app_store` + a `privacy.json`. Easy to
  assume `deliver` covers it — it doesn't.
- **Accessibility Nutrition Labels have an ASC API but no mature fastlane wrapper.**
  Hit the API directly: `POST /v1/accessibilityDeclarations` (`deviceFamily`
  attribute + `app` relationship). See `scripts/set-accessibility-declaration.mjs`.
- **Age Rating is only *partially* automatable.** The ASC API can set most of the
  questionnaire EXCEPT these fields, which stay web-only: *Unrestricted Web
  Access, User-Generated Content, Medical/Wellness, Guns/Other Weapons.* If the
  app needs any of those, finish that part in the web UI.
- **`eas submit` uploads the binary ONLY** — not metadata, not privacy, not
  accessibility labels. Those are separate steps. (Common false assumption.)
- One **ASC API Key (`.p8` + Key ID + Issuer ID)** authenticates all of the
  above. In an Expo repo it's already in `eas.json` under
  `submit.production.ios` (`ascApiKeyId`/`ascApiKeyIssuerId`/`ascApiKeyPath`/`ascAppId`).

## Cautions

- **ASC API schemas change.** Verify exact resource types / enum values before
  trusting any field name: https://developer.apple.com/documentation/appstoreconnectapi
- **Don't over-claim accessibility features.** Only declare a feature you tested
  across the app's core flows; over-claiming can be flagged.

## Files

- `scripts/asc-jwt.mjs` — mint the ES256 JWT for raw ASC API calls (the
  `dsaEncoding: 'ieee-p1363'` detail is a real gotcha; JWT max life 20 min).
- `scripts/set-accessibility-declaration.mjs` — accessibility label via raw API.
- `references/privacy.json` — `upload_app_privacy_details_to_app_store` template
  (the hard part is the exact enum strings: `DATA_LINKED_TO_YOU`,
  `OTHER_USER_CONTENT`, etc.).
