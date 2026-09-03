import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';
import { useNousRouteData } from 'src/hooks/use-nous-route-data';

import { LoadingScreen } from 'src/components/loading-screen';

import { NousSectionView } from 'src/sections/nous/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { loading, course, level, subject, chapter, section, notFound } = useNousRouteData();

  if (notFound) {
    return <Navigate to={paths.nous.root} replace />;
  }

  if (loading || !section) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Helmet>
        <title> {`${section.name} - ${chapter.name} - ${CONFIG.site.name}`}</title>
      </Helmet>

      <NousSectionView
        course={course}
        level={level}
        subject={subject}
        chapter={chapter}
        section={section}
      />
    </>
  );
}
