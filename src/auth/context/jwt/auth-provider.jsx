import { useMemo, useState, useEffect, useCallback } from 'react';

import { authApi } from 'src/lib/mock-server';

import { AuthContext } from '../auth-context';
import { getAccessToken, isValidToken, setSession } from './utils';

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    const accessToken = getAccessToken();

    if (!accessToken || !isValidToken(accessToken)) {
      setSession(null);
      setState({ user: null, loading: false });
      return;
    }

    try {
      // verifies the signature + expiry server side, then reloads the record so
      // a role change or a disabled account takes effect on the next page load
      const { user } = await authApi.me(accessToken);

      setState({ user: { ...user, accessToken }, loading: false });
    } catch (error) {
      console.error('[auth] session check failed:', error);
      setSession(null);
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      role: state.user?.role ?? null,
      isAdmin: state.user?.role === 'admin',
      loading: state.loading,
      authenticated: !!state.user,
      unauthenticated: !state.loading && !state.user,
      checkUserSession,
    }),
    [state.user, state.loading, checkUserSession]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
