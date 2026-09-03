import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useNousData } from 'src/context/nous-data';

import { LoadingScreen } from 'src/components/loading-screen';

import { NousHomeView } from 'src/sections/nous/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { loading } = useNousData();

  return (
    <>
      <Helmet>
        <title> {CONFIG.site.name}</title>
      </Helmet>

      {loading ? <LoadingScreen /> : <NousHomeView />}
    </>
  );
}
