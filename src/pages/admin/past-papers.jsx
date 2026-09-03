import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminPastPapersView } from 'src/sections/admin/view';

// ----------------------------------------------------------------------

const metadata = { title: `Past papers - Admin - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AdminPastPapersView />
    </>
  );
}
