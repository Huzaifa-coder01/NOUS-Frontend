import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';
import { useNousRouteData } from 'src/hooks/use-nous-route-data';

import { LoadingScreen } from 'src/components/loading-screen';

import { NousLevelView } from 'src/sections/nous/view';


// ----------------------------------------------------------------------

export default function Page() {
  const { loading, program, level, notFound } = useNousRouteData();

  if (notFound) {
    return <Navigate to={paths.nous.root} replace />;
  }

  if (loading || !level) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Helmet>
        <title> {`${level.name} - ${CONFIG.site.name}`}</title>
      </Helmet>

      <NousLevelView program={program} level={level} />
    </>
  );
}
