# App Store Connect publish — Claude Code skill

A Claude Code skill that captures the **non-obvious** facts about automating
App Store Connect listing management (what can be set as code vs. what's
web-only): App Privacy labels, Accessibility Nutrition Labels, the Age Rating
questionnaire, and where `eas submit` / `fastlane deliver` stop.

## Install

```
/plugin marketplace add KYHyeon/claude-skill-app-store-connect
/plugin install app-store-connect-publish@kyhyeon-skills
```

That's it — Claude will pick up the skill automatically when you work on App
Store Connect publishing.

## What's inside

- `SKILL.md` — the gotchas (e.g. App Privacy is **not** done by `deliver`;
  Accessibility labels need the raw ASC API; Age Rating is only partially
  automatable).
- `scripts/asc-jwt.mjs` — mint an ES256 JWT for raw ASC API calls (no deps).
- `scripts/set-accessibility-declaration.mjs` — create an Accessibility Nutrition
  Label via the ASC API.
- `references/privacy.json` — template for
  `upload_app_privacy_details_to_app_store`.

## License

MIT
