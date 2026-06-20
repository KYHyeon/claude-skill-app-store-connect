// Create / update an Accessibility Nutrition Label declaration via the
// App Store Connect API (no mature fastlane wrapper exists yet).
//
// IMPORTANT: the ASC API evolves. Verify the exact resource type, attribute
// names, and allowed enum values against the live docs before trusting this:
//   https://developer.apple.com/documentation/appstoreconnectapi
// Treat the attribute list below as a STARTING POINT, not gospel.
//
// Usage:
//   ASC_KEY_ID=XXXX ASC_ISSUER_ID=xxxx-... ASC_KEY_PATH=./AuthKey.p8 \
//   ASC_APP_ID=6xxxxxxxxx \
//     node scripts/set-accessibility-declaration.mjs
//
// Only declare features you have actually TESTED across the app's core flows.

import { mintAscJwt } from './asc-jwt.mjs';

const BASE = 'https://api.appstoreconnect.apple.com';

// Edit these to match what your app genuinely supports & you've verified.
// Each supported feature => true. Omit / false for anything untested.
const DECLARED_FEATURES = {
  supportsVoiceover: true,
  supportsVoiceControl: false,
  supportsLargerText: true,
  supportsDarkInterface: true,
  supportsDifferentiateWithoutColorAlone: false,
  supportsSufficientContrast: false,
  supportsReducedMotion: false,
  supportsCaptions: false, // N/A if no media
  supportsAudioDescriptions: false, // N/A if no media
};

async function ascFetch(token, path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`ASC ${init.method || 'GET'} ${path} -> ${res.status}\n${body}`);
  }
  return body ? JSON.parse(body) : null;
}

async function main() {
  const appId = process.env.ASC_APP_ID;
  if (!appId) throw new Error('Set ASC_APP_ID (the numeric ascAppId from eas.json)');

  const token = mintAscJwt({
    keyId: process.env.ASC_KEY_ID,
    issuerId: process.env.ASC_ISSUER_ID,
    keyPath: process.env.ASC_KEY_PATH,
  });

  // Resource type / endpoint per ASC API. Verify against current docs.
  const payload = {
    data: {
      type: 'accessibilityDeclarations',
      attributes: {
        deviceFamily: 'IPHONE', // also: IPAD, MAC, APPLE_TV, APPLE_VISION_PRO
        ...DECLARED_FEATURES,
      },
      relationships: {
        app: { data: { type: 'apps', id: appId } },
      },
    },
  };

  const result = await ascFetch(token, '/v1/accessibilityDeclarations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  console.log('Created accessibility declaration:', JSON.stringify(result, null, 2));
  console.log('\nReview/publish state in App Store Connect web if required.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
