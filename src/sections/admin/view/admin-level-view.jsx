import { useNavigate } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { catalogApi } from 'src/lib/mock-server';
import { countActive } from 'src/utils/catalog';
import { STATUS_OPTIONS } from 'src/_mock/_nous';
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
  { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
];

const EDIT_FIELDS = [{ name: 'name', label: 'Subject name', required: true }];

const DELETE_NOTE =
  'Its chapters, past papers, syllabus and notes are kept in the database and switched to inactive.';

// ----------------------------------------------------------------------

export function AdminLevelView({ course, level }) {
  const { refresh } = useNousData();

  const navigate = useNavigate();

  const path = { courseId: course.id, levelId: level.id };

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
      width: 130,
      render: (row) => (
        <Label color="info">
          {countActive(row.chapters)}/{row.chapters.length}
        </Label>
      ),
    },
    {
      id: 'pastPapers',
      label: 'Past papers',
      width: 200,
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Label color={countActive(row.pastPapers) ? 'success' : 'default'}>
            {countActive(row.pastPapers)}/{(row.pastPapers ?? []).length}
          </Label>

          <Button
            size="small"
            color="inherit"
            startIcon={<Iconify icon="solar:document-text-bold" />}
            onClick={() =>
              navigate(paths.admin.catalog.subjectPastPapers(course.id, level.id, row.id))
            }
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
        { name: course.name, href: paths.admin.catalog.course(course.id) },
        { name: level.name },
      ]}
      rows={level.subjects}
      columns={columns}
      searchPlaceholder="Search subject..."
      createLabel="New subject"
      fields={(isEdit) => (isEdit ? EDIT_FIELDS : CREATE_FIELDS)}
      editLabel="Edit subject"
      cascades
      deleteNote={DELETE_NOTE}
      emptyValues={{ name: '', chapters: 10, status: STATUS_OPTIONS[0].value }}
      toValues={(row) => ({ name: row.name })}
      onCreate={async (values) => {
        await catalogApi.create('subject', path, values);
        await refresh();
      }}
      onUpdate={async (row, values) => {
        await catalogApi.update('subject', { ...path, subjectId: row.id }, values);
        await refresh();
      }}
      onToggleStatus={async (row, status) => {
        await catalogApi.setStatus('subject', { ...path, subjectId: row.id }, status);
        await refresh();
      }}
      onDelete={async (row) => {
        await catalogApi.remove('subject', { ...path, subjectId: row.id });
        await refresh();
      }}
      onMove={async (row, direction) => {
        await catalogApi.move('subject', { ...path, subjectId: row.id }, direction);
        await refresh();
      }}
      onOpen={(row) => navigate(paths.admin.catalog.subject(course.id, level.id, row.id))}
      openLabel="Chapters"
    />
  );
}
