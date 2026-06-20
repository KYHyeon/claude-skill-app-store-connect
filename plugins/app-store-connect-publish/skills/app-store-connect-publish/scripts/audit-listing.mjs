// Read-only audit of an App Store Connect listing: surveys every editable field
// across app-info + version localizations + review detail and flags what's EMPTY
// (and locales that exist but are blank — those block submission).
//
// Pairs with the rest of this skill: run this first to see the gaps, then fill
// them (text/URLs via the public ASC API or fastlane deliver; App Privacy via
// the fastlane Apple-ID session; screenshots via deliver).
//
// Usage:
//   ASC_KEY_ID=... ASC_ISSUER_ID=... ASC_KEY_PATH=./AuthKey.p8 ASC_APP_ID=6xxxxxxxxx \
//     node scripts/audit-listing.mjs

import { mintAscJwt } from './asc-jwt.mjs';

const BASE = 'https://api.appstoreconnect.apple.com';
const isEmpty = (v) => v === null || v === '' || v === undefined;

async function main() {
  const appId = process.env.ASC_APP_ID;
  if (!appId) throw new Error('Set ASC_APP_ID');
  const token = mintAscJwt({
    keyId: process.env.ASC_KEY_ID,
    issuerId: process.env.ASC_ISSUER_ID,
    keyPath: process.env.ASC_KEY_PATH,
  });
  const h = { headers: { Authorization: `Bearer ${token}` } };
  const get = async (p) => {
    const r = await fetch(BASE + p, h);
    try { return JSON.parse(await r.text()); } catch { return {}; }
  };

  const gaps = [];
  const flag = (where, field) => gaps.push(`${where}: ${field}`);

  // App-level info + localizations + categories
  const ai = await get(`/v1/apps/${appId}/appInfos?include=appInfoLocalizations,primaryCategory,secondaryCategory&limit=1`);
  const info = ai.data?.[0];
  if (!info?.relationships?.primaryCategory?.data) flag('app-info', 'primaryCategory');
  for (const l of (ai.included || []).filter((x) => x.type === 'appInfoLocalizations')) {
    const a = l.attributes;
    for (const f of ['name', 'subtitle', 'privacyPolicyUrl']) if (isEmpty(a[f])) flag(`app-info[${a.locale}]`, f);
  }

  // Version-level localizations
  const vs = await get(`/v1/apps/${appId}/appStoreVersions?limit=1`);
  const v = vs.data?.[0];
  const isFirst = v?.attributes?.appStoreState === 'PREPARE_FOR_SUBMISSION';
  const vl = await get(`/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations`);
  for (const l of vl.data || []) {
    const a = l.attributes;
    // whatsNew is not required for a first submission
    const required = ['description', 'keywords', 'supportUrl'];
    for (const f of required) if (isEmpty(a[f])) flag(`version[${a.locale}]`, f);
    if (!isFirst && isEmpty(a.whatsNew)) flag(`version[${a.locale}]`, 'whatsNew');
    const ss = await get(`/v1/appStoreVersionLocalizations/${l.id}/appScreenshotSets`);
    if (!ss.data?.length) flag(`version[${a.locale}]`, 'screenshots (0 sets)');
  }

  // Review detail
  const rd = await get(`/v1/appStoreVersions/${v.id}/appStoreReviewDetail`);
  if (rd.data && isEmpty(rd.data.attributes.notes)) flag('review-detail', 'notes');

  console.log(`Version ${v?.attributes?.versionString} (${v?.attributes?.appStoreState})`);
  console.log(`Locales: app-info=${(ai.included || []).filter((x) => x.type === 'appInfoLocalizations').map((l) => l.attributes.locale).join(',')} | version=${(vl.data || []).map((l) => l.attributes.locale).join(',')}`);
  if (!gaps.length) console.log('\nNo empty fields found.');
  else { console.log(`\n${gaps.length} empty field(s):`); gaps.forEach((g) => console.log('  -', g)); }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
