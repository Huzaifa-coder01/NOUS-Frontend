import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export const CONFIG = {
  site: {
    name: 'NOUS',
    description: 'Organized learning platform for CA & ACCA',
    basePath: import.meta.env.VITE_BASE_PATH ?? '',
    version: packageJson.version,
  },
  auth: {
    /** Where a signed-in user lands after sign in / sign up. */
    redirectPath: paths.nous.root,
    /** Where an admin lands after sign in. */
    adminRedirectPath: paths.admin.root,
  },
};
