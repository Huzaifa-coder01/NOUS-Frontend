/**
 * Minimal HS256 JWT implementation used by the NOUS mock backend.
 *
 * IMPORTANT: this signs tokens in the browser, so the secret is public and the
 * signature proves nothing to an attacker. It exists so the app speaks real JWT
 * (header.payload.signature, `exp`, `role` claim) while there is no server.
 * When the real API lands, `src/lib/mock-server.js` is the only file that has to
 * change - tokens keep the same shape and the auth provider keeps working.
 */

const SECRET = 'nous-dev-only-secret';

const encoder = new TextEncoder();

// ----------------------------------------------------------------------

function base64UrlEncode(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  return atob(padded);
}

async function hmacSha256(message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));

  return base64UrlEncode(new Uint8Array(signature));
}

// ----------------------------------------------------------------------

export const DEFAULT_EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days

export async function signToken(payload, expiresIn = DEFAULT_EXPIRES_IN) {
  const issuedAt = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(
    encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  );

  const body = base64UrlEncode(
    encoder.encode(JSON.stringify({ ...payload, iat: issuedAt, exp: issuedAt + expiresIn }))
  );

  const signature = await hmacSha256(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

export function decodeToken(token) {
  try {
    const [, body] = String(token).split('.');

    if (!body) return null;

    return JSON.parse(base64UrlDecode(body));
  } catch {
    return null;
  }
}

export function isExpired(payload) {
  return !payload?.exp || payload.exp <= Math.floor(Date.now() / 1000);
}

export async function verifyToken(token) {
  const parts = String(token ?? '').split('.');

  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;

  const expected = await hmacSha256(`${header}.${body}`);

  if (expected !== signature) return null;

  const payload = decodeToken(token);

  return payload && !isExpired(payload) ? payload : null;
}

// ----------------------------------------------------------------------

/** Mock-only password hashing - a real backend must use bcrypt/argon2 server side. */
export async function hashPassword(password) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`nous:${password}`));

  return base64UrlEncode(new Uint8Array(digest));
}
