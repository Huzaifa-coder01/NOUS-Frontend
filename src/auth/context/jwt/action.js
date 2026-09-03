import { authApi } from 'src/lib/mock-server';

import { setSession } from './utils';

/** **************************************
 * Sign in
 *************************************** */
export async function signInWithPassword({ email, password }) {
  const { accessToken, user } = await authApi.signIn({ email, password });

  setSession(accessToken);

  return user;
}

/** **************************************
 * Sign up
 *************************************** */
export async function signUp({ name, email, password }) {
  const { accessToken, user } = await authApi.signUp({ name, email, password });

  setSession(accessToken);

  return user;
}

/** **************************************
 * Sign out
 *************************************** */
export async function signOut() {
  setSession(null);
}

/** **************************************
 * Password reset (mock: the code is returned instead of emailed)
 *************************************** */
const RESET_KEY = 'nous.passwordReset';

export async function requestPasswordReset({ email }) {
  const result = await authApi.requestPasswordReset({ email });

  sessionStorage.setItem(RESET_KEY, JSON.stringify(result));

  return result;
}

export function getPendingReset() {
  try {
    return JSON.parse(sessionStorage.getItem(RESET_KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function verifyResetCode({ code }) {
  const pending = getPendingReset();

  if (!pending) throw new Error('Request a new reset code');

  await authApi.verifyResetCode({ email: pending.email, code });

  sessionStorage.setItem(RESET_KEY, JSON.stringify({ ...pending, verifiedCode: code }));

  return true;
}

export async function resetPassword({ password }) {
  const pending = getPendingReset();

  if (!pending?.verifiedCode) throw new Error('Verify your reset code first');

  await authApi.resetPassword({
    email: pending.email,
    code: pending.verifiedCode,
    password,
  });

  sessionStorage.removeItem(RESET_KEY);

  return true;
}
