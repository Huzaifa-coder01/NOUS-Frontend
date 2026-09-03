import { paths } from 'src/routes/paths';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  analytics: icon('ic-analytics'),
  course: icon('ic-course'),
  folder: icon('ic-folder'),
  file: icon('ic-file'),
  user: icon('ic-user'),
  parameter: icon('ic-parameter'),
};

// ----------------------------------------------------------------------

/** NOUS admin navigation. */
export const navData = [
  {
    subheader: 'Overview',
    items: [{ title: 'Analytics', path: paths.admin.root, icon: ICONS.analytics }],
  },
  {
    subheader: 'Manage',
    items: [
      {
        title: 'Catalog',
        path: paths.admin.catalog.root,
        icon: ICONS.course,
        children: [
          { title: 'Programs', path: paths.admin.catalog.root },
          { title: 'CA', path: paths.admin.catalog.program('ca') },
          { title: 'ACCA', path: paths.admin.catalog.program('acca') },
        ],
      },
      { title: 'Past papers', path: paths.admin.pastPapers, icon: ICONS.file },
      { title: 'Users', path: paths.admin.users, icon: ICONS.user },
    ],
  },
  {
    subheader: 'Account',
    items: [
      { title: 'Profile', path: paths.admin.profile, icon: ICONS.user },
      { title: 'Settings', path: paths.admin.settings, icon: ICONS.parameter },
      { title: 'View site', path: paths.nous.root, icon: ICONS.folder },
    ],
  },
];
