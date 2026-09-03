import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';
import { useNousRouteData } from 'src/hooks/use-nous-route-data';

import { LoadingScreen } from 'src/components/loading-screen';

import { AdminChapterView } from 'src/sections/admin/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { loading, course, level, subject, chapter, notFound } = useNousRouteData({
    scope: 'admin',
  });

  if (notFound) {
    return <Navigate to={paths.admin.catalog.root} replace />;
  }

  if (loading || !chapter) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Helmet>
        <title> {`${chapter.name} - Admin - ${CONFIG.site.name}`}</title>
      </Helmet>

      <AdminChapterView course={course} level={level} subject={subject} chapter={chapter} />
    </>
  );
}
