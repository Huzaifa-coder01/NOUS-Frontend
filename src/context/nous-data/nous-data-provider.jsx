import { createContext, useMemo, useState, useEffect, useCallback } from 'react';

import { catalogApi } from 'src/lib/mock-server';

// ----------------------------------------------------------------------

export const NousDataContext = createContext(undefined);

/**
 * Single source of truth for the catalog + site settings.
 *
 * The admin panel mutates through `catalogApi` and then calls `refresh()`, so
 * every change is visible on the public site straight away.
 */
export function NousDataProvider({ children }) {
  const [programs, setPrograms] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [nextPrograms, nextSettings] = await Promise.all([
        catalogApi.get(),
        catalogApi.getSettings(),
      ]);

      setPrograms(nextPrograms);
      setSettings(nextSettings);
      setError(null);
    } catch (err) {
      console.error('[catalog] load failed:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const memoizedValue = useMemo(
    () => ({ programs, settings, loading, error, refresh }),
    [programs, settings, loading, error, refresh]
  );

  return <NousDataContext.Provider value={memoizedValue}>{children}</NousDataContext.Provider>;
}
