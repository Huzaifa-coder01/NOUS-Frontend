import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const _account = [
  {
    label: 'Public site',
    href: paths.nous.root,
    icon: <Iconify icon="solar:home-angle-bold-duotone" />,
  },
  {
    label: 'Profile',
    href: paths.admin.profile,
    icon: <Iconify icon="solar:user-bold-duotone" />,
  },
  {
    label: 'Settings',
    href: paths.admin.settings,
    icon: <Iconify icon="solar:settings-bold-duotone" />,
  },
];
