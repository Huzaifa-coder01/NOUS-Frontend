import { useNavigate } from 'react-router-dom';

import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { catalogApi } from 'src/lib/mock-server';
import { countActive } from 'src/utils/catalog';
import { STATUS_OPTIONS } from 'src/_mock/_nous';
import { useNousData } from 'src/context/nous-data';

import { Label } from 'src/components/label';

import { EntityList } from '../components/entity-list';

// ----------------------------------------------------------------------

const FIELDS = [
  { name: 'name', label: 'Level name', required: true },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
];

const fieldsFor = (isEdit) => (isEdit ? FIELDS.filter((field) => field.name !== 'status') : FIELDS);

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
    width: 130,
    render: (row) => (
      <Label color="info">
        {countActive(row.subjects)}/{row.subjects.length}
      </Label>
    ),
  },
  {
    id: 'chapters',
    label: 'Chapters',
    width: 120,
    render: (row) => row.subjects.reduce((total, subject) => total + subject.chapters.length, 0),
  },
];

const DELETE_NOTE =
  'Its subjects, chapters, past papers, syllabus and notes are kept in the database and switched to inactive.';

// ----------------------------------------------------------------------

export function AdminCourseView({ course }) {
  const { refresh } = useNousData();

  const navigate = useNavigate();

  const path = { courseId: course.id };

  return (
    <EntityList
      heading="Levels"
      links={[
        { name: 'Admin', href: paths.admin.root },
        { name: 'Catalog', href: paths.admin.catalog.root },
        { name: course.name },
      ]}
      rows={course.levels}
      columns={COLUMNS}
      searchPlaceholder="Search level..."
      createLabel="New level"
      fields={fieldsFor}
      editLabel="Edit level"
      cascades
      deleteNote={DELETE_NOTE}
      emptyValues={{ name: '', status: STATUS_OPTIONS[0].value }}
      toValues={(row) => ({ name: row.name })}
      onCreate={async (values) => {
        await catalogApi.create('level', path, values);
        await refresh();
      }}
      onUpdate={async (row, values) => {
        await catalogApi.update('level', { ...path, levelId: row.id }, values);
        await refresh();
      }}
      onToggleStatus={async (row, status) => {
        await catalogApi.setStatus('level', { ...path, levelId: row.id }, status);
        await refresh();
      }}
      onDelete={async (row) => {
        await catalogApi.remove('level', { ...path, levelId: row.id });
        await refresh();
      }}
      onMove={async (row, direction) => {
        await catalogApi.move('level', { ...path, levelId: row.id }, direction);
        await refresh();
      }}
      onOpen={(row) => navigate(paths.admin.catalog.level(course.id, row.id))}
      openLabel="Subjects"
    />
  );
}
