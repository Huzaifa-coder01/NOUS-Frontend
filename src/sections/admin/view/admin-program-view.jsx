import { useNavigate } from 'react-router-dom';

import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { catalogApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';

import { Label } from 'src/components/label';

import { EntityList } from '../components/entity-list';

// ----------------------------------------------------------------------

const FIELDS = [{ name: 'name', label: 'Level name', required: true }];

const COLUMNS = [
  {
    id: 'name',
    label: 'Level',
    render: (row) => (
      <>
        <Typography variant="subtitle2">{row.name}</Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          /{row.id}
        </Typography>
      </>
    ),
  },
  {
    id: 'subjects',
    label: 'Subjects',
    width: 120,
    render: (row) => <Label color="info">{row.subjects.length}</Label>,
  },
  {
    id: 'chapters',
    label: 'Chapters',
    width: 120,
    render: (row) => row.subjects.reduce((total, subject) => total + subject.chapters.length, 0),
  },
];

// ----------------------------------------------------------------------

export function AdminProgramView({ program }) {
  const { refresh } = useNousData();

  const navigate = useNavigate();

  return (
    <EntityList
      heading="Levels"
      links={[
        { name: 'Admin', href: paths.admin.root },
        { name: 'Catalog', href: paths.admin.catalog.root },
        { name: program.name },
      ]}
      rows={program.levels}
      columns={COLUMNS}
      searchPlaceholder="Search level..."
      createLabel="New level"
      fields={FIELDS}
      emptyValues={{ name: '' }}
      toValues={(row) => ({ name: row.name })}
      onCreate={async (values) => {
        await catalogApi.createLevel(program.id, values);
        await refresh();
      }}
      onUpdate={async (row, values) => {
        await catalogApi.updateLevel(program.id, row.id, values);
        await refresh();
      }}
      onDelete={async (row) => {
        await catalogApi.deleteLevel(program.id, row.id);
        await refresh();
      }}
      onMove={async (row, direction) => {
        await catalogApi.moveLevel(program.id, row.id, direction);
        await refresh();
      }}
      onOpen={(row) => navigate(paths.admin.catalog.level(program.id, row.id))}
      openLabel="Subjects"
    />
  );
}
