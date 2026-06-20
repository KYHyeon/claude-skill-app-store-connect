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
The API facts below were **verified live against a real app (2026-06)** with
read-only calls — not from docs/forums, which are often stale.

## The gotchas

- **App Privacy labels are NOT done by `deliver`.** Separate fastlane action:
  `upload_app_privacy_details_to_app_store` + a `privacy.json`. Easy to assume
  `deliver` covers it — it doesn't.
- **Accessibility Nutrition Labels: ASC API resource `accessibilityDeclarations`,
  no mature fastlane wrapper.** Verified allowed ops: `CREATE, DELETE,
  GET_INSTANCE, UPDATE`. The bare collection `GET /v1/accessibilityDeclarations`
  is **blocked (403)** — read existing ones app-scoped instead:
  `GET /v1/apps/{id}/accessibilityDeclarations`. Create with
  `POST /v1/accessibilityDeclarations` (see `scripts/`).
- **Age Rating IS automatable via the API** — the common "those fields are
  web-only" claim is **outdated** for the 2026 questionnaire. The
  `ageRatingDeclaration` resource (read: `GET /v1/appInfos/{appInfoId}/ageRatingDeclaration`)
  exposes ALL questionnaire fields as attributes, including the ones older
  sources said were impossible: `unrestrictedWebAccess`, `userGeneratedContent`,
  `medicalOrTreatmentInformation`, `gunsOrOtherWeapons`. Allowed op: `UPDATE`
  (collection GET is blocked). Full field list in `references/age-rating-fields.md`.
  (Read + allowed-op verified; a write wasn't performed.)
- **`eas submit` uploads the binary ONLY** — not metadata, not privacy, not
  accessibility labels. Those are separate steps. (Common false assumption.)
- One **ASC API Key (`.p8` + Key ID + Issuer ID)** authenticates all of the
  above and works for the raw REST API too (JWT verified). In an Expo repo the
  IDs are already in `eas.json` under `submit.production.ios`
  (`ascApiKeyId`/`ascApiKeyIssuerId`/`ascApiKeyPath`/`ascAppId`).

## Cautions

- **ASC API schemas change** (this skill already caught one stale "fact").
  Re-verify field names with a read-only GET before a write:
  https://developer.apple.com/documentation/appstoreconnectapi
- **Don't over-claim accessibility features.** Only declare a feature you tested
  across the app's core flows.

## Files

- `scripts/asc-jwt.mjs` — mint the ES256 JWT for raw ASC API calls (the
  `dsaEncoding: 'ieee-p1363'` detail is a real gotcha; JWT max life 20 min).
  Verified working.
- `scripts/set-accessibility-declaration.mjs` — accessibility label via raw API.
- `references/privacy.json` — `upload_app_privacy_details_to_app_store` template
  (the hard part is the exact enum strings: `DATA_LINKED_TO_YOU`,
  `OTHER_USER_CONTENT`, etc.).
- `references/age-rating-fields.md` — the real 27 `ageRatingDeclaration`
  attribute names (hard to guess; verified live).
