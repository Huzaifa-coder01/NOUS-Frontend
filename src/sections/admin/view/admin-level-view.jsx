import { useNavigate } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { catalogApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { EntityList } from '../components/entity-list';

// ----------------------------------------------------------------------

const CREATE_FIELDS = [
  { name: 'name', label: 'Subject name', required: true },
  {
    name: 'chapters',
    label: 'Chapters to generate',
    type: 'number',
    helperText: 'Chapters can also be added one by one later',
  },
];

const EDIT_FIELDS = [{ name: 'name', label: 'Subject name', required: true }];

// ----------------------------------------------------------------------

export function AdminLevelView({ program, level }) {
  const { refresh } = useNousData();

  const navigate = useNavigate();

  const columns = [
    {
      id: 'name',
      label: 'Subject',
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
      id: 'chapters',
      label: 'Chapters',
      width: 120,
      render: (row) => <Label color="info">{row.chapters.length}</Label>,
    },
    {
      id: 'pastPapers',
      label: 'Past papers',
      width: 180,
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Label color={(row.pastPapers ?? []).length ? 'success' : 'default'}>
            {(row.pastPapers ?? []).length}
          </Label>

          <Button
            size="small"
            color="inherit"
            startIcon={<Iconify icon="solar:document-text-bold" />}
            onClick={() => navigate(paths.admin.catalog.subjectPapers(program.id, level.id, row.id))}
          >
            Manage
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <EntityList
      heading="Subjects"
      links={[
        { name: 'Admin', href: paths.admin.root },
        { name: 'Catalog', href: paths.admin.catalog.root },
        { name: program.name, href: paths.admin.catalog.program(program.id) },
        { name: level.name },
      ]}
      rows={level.subjects}
      columns={columns}
      searchPlaceholder="Search subject..."
      createLabel="New subject"
      fields={(isEdit) => (isEdit ? EDIT_FIELDS : CREATE_FIELDS)}
      emptyValues={{ name: '', chapters: 10 }}
      toValues={(row) => ({ name: row.name })}
      onCreate={async (values) => {
        await catalogApi.createSubject(program.id, level.id, values);
        await refresh();
      }}
      onUpdate={async (row, values) => {
        await catalogApi.updateSubject(program.id, level.id, row.id, { name: values.name });
        await refresh();
      }}
      onDelete={async (row) => {
        await catalogApi.deleteSubject(program.id, level.id, row.id);
        await refresh();
      }}
      onMove={async (row, direction) => {
        await catalogApi.moveSubject(program.id, level.id, row.id, direction);
        await refresh();
      }}
      onOpen={(row) => navigate(paths.admin.catalog.subject(program.id, level.id, row.id))}
      openLabel="Chapters"
    />
  );
}
