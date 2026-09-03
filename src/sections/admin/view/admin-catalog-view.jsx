import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { catalogApi } from 'src/lib/mock-server';
import { PROGRAM_ICONS } from 'src/_mock/_nous';
import { useNousData } from 'src/context/nous-data';

import { Label } from 'src/components/label';

import { EntityList } from '../components/entity-list';

// ----------------------------------------------------------------------

const FIELDS = [
  { name: 'name', label: 'Program name', required: true },
  {
    name: 'icon',
    label: 'Icon',
    type: 'select',
    options: PROGRAM_ICONS.map((icon) => ({ value: icon, label: icon })),
  },
  { name: 'description', label: 'Description', type: 'multiline', minRows: 3 },
];

const COLUMNS = [
  {
    id: 'name',
    label: 'Program',
    render: (row) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box component="span" sx={{ fontSize: 22 }}>
          {row.icon}
        </Box>
        <Box>
          <Typography variant="subtitle2">{row.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            /{row.id}
          </Typography>
        </Box>
      </Box>
    ),
  },
  {
    id: 'description',
    label: 'Description',
    render: (row) => (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {row.description}
      </Typography>
    ),
  },
  {
    id: 'levels',
    label: 'Levels',
    width: 100,
    render: (row) => <Label color="info">{row.levels.length}</Label>,
  },
];

// ----------------------------------------------------------------------

export function AdminCatalogView() {
  const { programs, refresh } = useNousData();

  const navigate = useNavigate();

  return (
    <EntityList
      heading="Programs"
      links={[{ name: 'Admin', href: paths.admin.root }, { name: 'Catalog' }]}
      rows={programs}
      columns={COLUMNS}
      searchFields={['name', 'description']}
      searchPlaceholder="Search program..."
      createLabel="New program"
      fields={FIELDS}
      emptyValues={{ name: '', icon: PROGRAM_ICONS[0], description: '' }}
      toValues={(row) => ({ name: row.name, icon: row.icon, description: row.description })}
      onCreate={async (values) => {
        await catalogApi.createProgram(values);
        await refresh();
      }}
      onUpdate={async (row, values) => {
        await catalogApi.updateProgram(row.id, values);
        await refresh();
      }}
      onDelete={async (row) => {
        await catalogApi.deleteProgram(row.id);
        await refresh();
      }}
      onMove={async (row, direction) => {
        await catalogApi.moveProgram(row.id, direction);
        await refresh();
      }}
      onOpen={(row) => navigate(paths.admin.catalog.program(row.id))}
      openLabel="Levels"
    />
  );
}
