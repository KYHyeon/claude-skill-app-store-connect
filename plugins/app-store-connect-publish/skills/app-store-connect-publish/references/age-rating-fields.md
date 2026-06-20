# `ageRatingDeclaration` attributes (verified live 2026-06)

Read: `GET /v1/appInfos/{appInfoId}/ageRatingDeclaration`
Write: `PATCH /v1/ageRatingDeclarations/{id}` (resource allows `UPDATE` only;
collection GET is blocked). Get `{appInfoId}` from
`GET /v1/apps/{appId}/appInfos`.

All 27 attributes returned by the live API — including the ones older forum
posts claimed were web-only (`unrestrictedWebAccess`, `userGeneratedContent`,
`medicalOrTreatmentInformation`, `gunsOrOtherWeapons`):

```
advertising
alcoholTobaccoOrDrugUseOrReferences
contests
gambling
gamblingSimulated
gunsOrOtherWeapons
healthOrWellnessTopics
kidsAgeBand
lootBox
medicalOrTreatmentInformation
messagingAndChat
parentalControls
profanityOrCrudeHumor
ageAssurance
sexualContentGraphicAndNudity
sexualContentOrNudity
horrorOrFearThemes
matureOrSuggestiveThemes
unrestrictedWebAccess
userGeneratedContent
violenceCartoonOrFantasy
violenceRealisticProlongedGraphicOrSadistic
violenceRealistic
ageRatingOverride
ageRatingOverrideV2
koreaAgeRatingOverride
developerAgeRatingInfoUrl
```

Frequency-style fields take enum values like `NONE`, `INFREQUENT_OR_MILD`,
`FREQUENT_OR_INTENSE`; booleans (`gambling`, `unrestrictedWebAccess`,
`userGeneratedContent`, etc.) take `true`/`false`. Verify exact enums per field
with a read-only GET before writing.
