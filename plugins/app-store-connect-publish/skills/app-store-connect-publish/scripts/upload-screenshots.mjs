// Upload App Store screenshots via the ASC API (reserve -> PUT bytes -> commit).
// Screenshots must be EXACT accepted pixel sizes per display type (e.g. 6.7" =
// 1290x2796). Resize before calling this; the API rejects off-spec dimensions.
//
// Usage:
//   ASC_KEY_ID=... ASC_ISSUER_ID=... ASC_KEY_PATH=./AuthKey.p8 ASC_APP_ID=6xxxxxxxxx \
//   DISPLAY_TYPE=APP_IPHONE_67 LOCALES=en-US,ko,fr-FR \
//     node scripts/upload-screenshots.mjs img1.png img2.png ...
//
// Images upload in the order given. LOCALES omitted = all version localizations.

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';
import { mintAscJwt } from './asc-jwt.mjs';

const BASE = 'https://api.appstoreconnect.apple.com';
const md5 = (buf) => createHash('md5').update(buf).digest('hex');

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) throw new Error('Pass image paths as arguments');
  const appId = process.env.ASC_APP_ID;
  const displayType = process.env.DISPLAY_TYPE || 'APP_IPHONE_67';
  const localeFilter = process.env.LOCALES ? process.env.LOCALES.split(',') : null;

  const token = mintAscJwt({
    keyId: process.env.ASC_KEY_ID,
    issuerId: process.env.ASC_ISSUER_ID,
    keyPath: process.env.ASC_KEY_PATH,
  });
  const auth = { Authorization: `Bearer ${token}` };
  const api = async (m, p, body) => {
    const r = await fetch(BASE + p, { method: m, headers: { ...auth, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const txt = await r.text();
    let j; try { j = JSON.parse(txt); } catch { j = { raw: txt }; }
    if (r.status >= 300) throw new Error(`${m} ${p} -> ${r.status} ${JSON.stringify(j.errors || j).slice(0, 300)}`);
    return j;
  };

  const vs = await api('GET', `/v1/apps/${appId}/appStoreVersions?limit=1`);
  const vId = vs.data[0].id;
  const vl = await api('GET', `/v1/appStoreVersions/${vId}/appStoreVersionLocalizations`);
  const locs = vl.data.filter((l) => !localeFilter || localeFilter.includes(l.attributes.locale));

  for (const loc of locs) {
    const locale = loc.attributes.locale;
    // reuse existing set of this display type, else create
    const sets = await api('GET', `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`);
    let set = sets.data.find((s) => s.attributes.screenshotDisplayType === displayType);
    if (!set) {
      set = (await api('POST', '/v1/appScreenshotSets', {
        data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: displayType }, relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: loc.id } } } },
      })).data;
    }

    for (const file of files) {
      const bytes = readFileSync(file);
      const fileName = basename(file);
      // 1) reserve
      const res = (await api('POST', '/v1/appScreenshots', {
        data: { type: 'appScreenshots', attributes: { fileName, fileSize: bytes.length }, relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } } },
      })).data;
      // 2) upload bytes per operation
      for (const op of res.attributes.uploadOperations) {
        const headers = {};
        for (const hh of op.requestHeaders || []) headers[hh.name] = hh.value;
        const slice = bytes.subarray(op.offset, op.offset + op.length);
        const put = await fetch(op.url, { method: op.method, headers, body: slice });
        if (!put.ok) throw new Error(`upload ${fileName} -> ${put.status}`);
      }
      // 3) commit
      await api('PATCH', `/v1/appScreenshots/${res.id}`, {
        data: { type: 'appScreenshots', id: res.id, attributes: { uploaded: true, sourceFileChecksum: md5(bytes) } },
      });
      console.log(`[${locale}] uploaded ${fileName}`);
    }
  }
  console.log('Done.');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
