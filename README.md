# App Store Connect publish — Claude Code skill

A Claude Code skill that captures the **non-obvious** facts about automating
App Store Connect listing management (what can be set as code vs. what's
web-only): App Privacy labels, Accessibility Nutrition Labels, the Age Rating
questionnaire, and where `eas submit` / `fastlane deliver` stop.

## Why this exists

Ask an AI assistant how to fill out your App Store listing and it almost always
says the same thing: *"go into App Store Connect and set it in the web UI."*
That's the path of least resistance for a model — but it's often **wrong**, and
it scales terribly when you ship more than one app.

The reality (verified against the live API, not docs/forums):

- App Privacy "nutrition" labels are settable as code — just not via the action
  everyone assumes (`deliver`).
- Accessibility Nutrition Labels have a real ASC API resource.
- The Age Rating questionnaire is settable via the API too — including the very
  fields that older forum answers (and AI assistants parroting them) insist are
  web-only. That claim is **outdated** for the 2026 questionnaire.

Apple doesn't ship a first-class CLI for this, and AI assistants keep defaulting
to "use the website." This skill is an attempt to close that gap: encode the
**hard-to-guess, easy-to-get-wrong** facts so an AI can drive the listing as
code and give a far better workflow than click-through-the-web. As the tooling
and the API evolve, the skill is the place to keep that knowledge correct —
including catching when a "well-known fact" has gone stale (this skill already
caught one).

It deliberately leaves out general knowledge (what `deliver`/`eas` are, ASC
character limits, etc.) — only the surprising parts that an AI wouldn't already
reliably know are kept.

## Install

```
/plugin marketplace add KYHyeon/claude-skill-app-store-connect
/plugin install app-store-connect-publish@kyhyeon-skills
```

That's it — Claude picks up the skill automatically when you work on App Store
Connect publishing.

## What's inside

- `SKILL.md` — the gotchas (App Privacy is **not** done by `deliver`;
  Accessibility labels need the raw ASC API; Age Rating **is** API-settable).
- `scripts/asc-jwt.mjs` — mint an ES256 JWT for raw ASC API calls (no deps).
- `scripts/set-accessibility-declaration.mjs` — create an Accessibility Nutrition
  Label via the ASC API.
- `references/privacy.json` — template for
  `upload_app_privacy_details_to_app_store`.
- `references/age-rating-fields.md` — the real `ageRatingDeclaration` attribute
  names, verified live.

## License

MIT
