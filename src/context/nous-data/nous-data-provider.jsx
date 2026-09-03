import { createContext, useMemo, useState, useEffect, useCallback } from 'react';

import { catalogApi } from 'src/lib/mock-server';
import { selectActiveTree, selectAdminTree } from 'src/utils/catalog';

// ----------------------------------------------------------------------

export const NousDataContext = createContext(undefined);

/**
 * Single source of truth for the catalog + site settings.
 *
 * Three views of the same tree are published so no screen has to remember which
 * records it is allowed to render:
 *
 *  - `courses`       raw, including deleted nodes (admin modules that report)
 *  - `adminCourses`  deleted nodes dropped, inactive kept (admin navigation)
 *  - `activeCourses` active and not deleted, all the way down (student site)
 *
 * The admin panel mutates through `catalogApi` and then calls `refresh()`, so
 * every change is visible on the student site straight away.
 */
export function NousDataProvider({ children }) {
  const [courses, setCourses] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [nextCourses, nextSettings] = await Promise.all([
        catalogApi.get(),
        catalogApi.getSettings(),
      ]);

      setCourses(nextCourses);
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

  const activeCourses = useMemo(() => selectActiveTree(courses), [courses]);

  const adminCourses = useMemo(() => selectAdminTree(courses), [courses]);

  const memoizedValue = useMemo(
    () => ({ courses, adminCourses, activeCourses, settings, loading, error, refresh }),
    [courses, adminCourses, activeCourses, settings, loading, error, refresh]
  );

  return <NousDataContext.Provider value={memoizedValue}>{children}</NousDataContext.Provider>;
}
