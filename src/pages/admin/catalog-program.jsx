import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';
import { useNousRouteData } from 'src/hooks/use-nous-route-data';

import { LoadingScreen } from 'src/components/loading-screen';

import { AdminProgramView } from 'src/sections/admin/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { loading, program, notFound } = useNousRouteData();

  if (notFound) {
    return <Navigate to={paths.admin.catalog.root} replace />;
  }

  if (loading || !program) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Helmet>
        <title> {`${program.name} - Admin - ${CONFIG.site.name}`}</title>
      </Helmet>

      <AdminProgramView program={program} />
    </>
  );
}
