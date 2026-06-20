// Mint an ES256 JWT for the App Store Connect API from a .p8 private key.
// No external deps — uses node:crypto only.
//
// Usage:
//   ASC_KEY_ID=XXXX ASC_ISSUER_ID=xxxx-... ASC_KEY_PATH=./AuthKey.p8 \
//     node scripts/asc-jwt.mjs
//
// Or import mintAscJwt() from another script.
//
// Docs: https://developer.apple.com/documentation/appstoreconnectapi/generating_tokens_for_api_requests

import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

/**
 * @param {{keyId: string, issuerId: string, keyPath: string, expSeconds?: number}} opts
 * @returns {string} signed JWT (valid for up to 20 minutes per Apple's limit)
 */
export function mintAscJwt({ keyId, issuerId, keyPath, expSeconds = 1200 }) {
  if (!keyId || !issuerId || !keyPath) {
    throw new Error('mintAscJwt requires keyId, issuerId, keyPath');
  }
  const privateKey = readFileSync(keyPath, 'utf8');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + Math.min(expSeconds, 1200), // Apple rejects tokens older than 20 min
    aud: 'appstoreconnect-v1',
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signer = createSign('SHA256');
  signer.update(signingInput);
  // dsaEncoding 'ieee-p1363' produces the raw r||s signature ES256 (JWS) requires.
  const signature = signer.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${signingInput}.${b64url(signature)}`;
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const token = mintAscJwt({
    keyId: process.env.ASC_KEY_ID,
    issuerId: process.env.ASC_ISSUER_ID,
    keyPath: process.env.ASC_KEY_PATH,
  });
  process.stdout.write(token + '\n');
}
