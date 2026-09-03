import { decodeToken, isExpired } from 'src/lib/mock-jwt';

import { STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export function getAccessToken() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSession(accessToken) {
  if (accessToken) {
    localStorage.setItem(STORAGE_KEY, accessToken);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** Cheap client-side check; the mock server still verifies the signature. */
export function isValidToken(accessToken) {
  const payload = decodeToken(accessToken);

  return !!payload && !isExpired(payload);
}

export { decodeToken };
