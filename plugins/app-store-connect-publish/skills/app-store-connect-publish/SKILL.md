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

## The job (how to operate)

Read the WHOLE listing, fill what's missing, and update — but split by confidence:

1. **Audit exhaustively (read-only first).** Run `scripts/audit-listing.mjs` to
   list every empty field across app-info localizations, version localizations
   (incl. screenshots), review detail, age rating. Also flag locales that exist
   but are blank — those block submission.
2. **Fill what's certain** — values you can derive unambiguously (e.g. a
   locale-agnostic privacy-policy URL copied from another locale; review notes
   the user already provided). Filling still writes to the LIVE listing, so get
   a go-ahead before the write batch.
3. **For anything uncertain, confirm before writing** — translations, which
   locales to keep vs delete, screenshots, age-rating answers, anything that's a
   judgment call. Present the choice (AskUserQuestion), then update.

Never guess into a live write. "Certain → fill, uncertain → confirm" is the rule.

## The gotchas

- **App Privacy labels are NOT in the public ASC API at all**, and NOT done by
  `deliver`. The `appDataUsages` resources don't exist on the public REST API,
  so the `.p8` API key can't set them. The only programmatic route is the
  fastlane action `upload_app_privacy_details_to_app_store`, which authenticates
  with **Apple ID username/password + 2FA** (a spaceship session hitting the
  internal endpoints), not the API key — and needs an Apple ID with owner/admin
  on the team. The `json_path` file is a **root-level JSON array** of
  `{category, purposes, data_protections}` (e.g. `category: "NAME"`,
  `purposes: ["APP_FUNCTIONALITY"]`, `data_protections: ["DATA_LINKED_TO_YOU"]`).
  For "no data collected": `[{"data_protections": ["DATA_NOT_COLLECTED"]}]`.
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

- `scripts/audit-listing.mjs` — read-only sweep that lists every empty field
  + blank locales (run this first; it's the "read the whole listing" step).
- `scripts/asc-jwt.mjs` — mint the ES256 JWT for raw ASC API calls (the
  `dsaEncoding: 'ieee-p1363'` detail is a real gotcha; JWT max life 20 min).
  Verified working.
- `scripts/set-accessibility-declaration.mjs` — accessibility label via raw API.
- `references/privacy.json` — `upload_app_privacy_details_to_app_store` template
  (the hard part is the exact enum strings: `DATA_LINKED_TO_YOU`,
  `OTHER_USER_CONTENT`, etc.).
- `references/age-rating-fields.md` — the real 27 `ageRatingDeclaration`
  attribute names (hard to guess; verified live).
