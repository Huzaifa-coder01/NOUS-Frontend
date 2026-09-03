import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';
import { useNousRouteData } from 'src/hooks/use-nous-route-data';

import { LoadingScreen } from 'src/components/loading-screen';

import { AdminSubjectPapersView } from 'src/sections/admin/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { loading, program, level, subject, chapter, notFound } = useNousRouteData();

  if (notFound) {
    return <Navigate to={paths.admin.catalog.root} replace />;
  }

  if (loading || !subject) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Helmet>
        <title> {`Past papers - Admin - ${CONFIG.site.name}`}</title>
      </Helmet>

      <AdminSubjectPapersView program={program} level={level} subject={subject} />
    </>
  );
}
