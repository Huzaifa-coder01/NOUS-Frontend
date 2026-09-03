import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { catalogApi } from 'src/lib/mock-server';
import { countActive } from 'src/utils/catalog';
import { useNousData } from 'src/context/nous-data';
import { COURSE_ICONS, STATUS_OPTIONS } from 'src/_mock/_nous';

import { Label } from 'src/components/label';

import { EntityList } from '../components/entity-list';

// ----------------------------------------------------------------------

const FIELDS = [
  { name: 'name', label: 'Course name', required: true },
  {
    name: 'icon',
    label: 'Icon',
    type: 'select',
    options: COURSE_ICONS.map((icon) => ({ value: icon, label: icon })),
  },
  { name: 'description', label: 'Description', type: 'multiline', minRows: 3 },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: STATUS_OPTIONS,
    helperText: 'Students only ever see active courses',
  },
];

/** Status is set with the row toggle, so it is only offered when creating. */
const fieldsFor = (isEdit) => (isEdit ? FIELDS.filter((field) => field.name !== 'status') : FIELDS);

const COLUMNS = [
  {
    id: 'name',
    label: 'Course',
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
    width: 120,
    render: (row) => (
      <Label color="info">
        {countActive(row.levels)}/{row.levels.length}
      </Label>
    ),
  },
];

const DELETE_NOTE =
  'Its levels, subjects, chapters, past papers, syllabus and notes are kept in the database and switched to inactive.';

// ----------------------------------------------------------------------

export function AdminCatalogView() {
  const { adminCourses, refresh } = useNousData();

  const navigate = useNavigate();

  return (
    <EntityList
      heading="Courses"
      links={[{ name: 'Admin', href: paths.admin.root }, { name: 'Catalog' }]}
      rows={adminCourses}
      columns={COLUMNS}
      searchFields={['name', 'description']}
      searchPlaceholder="Search course..."
      createLabel="New course"
      fields={fieldsFor}
      editLabel="Edit course"
      cascades
      deleteNote={DELETE_NOTE}
      emptyValues={{
        name: '',
        icon: COURSE_ICONS[0],
        description: '',
        status: STATUS_OPTIONS[0].value,
      }}
      toValues={(row) => ({
        name: row.name,
        icon: row.icon,
        description: row.description,
      })}
      onCreate={async (values) => {
        await catalogApi.create('course', {}, values);
        await refresh();
      }}
      onUpdate={async (row, values) => {
        await catalogApi.update('course', { courseId: row.id }, values);
        await refresh();
      }}
      onToggleStatus={async (row, status) => {
        await catalogApi.setStatus('course', { courseId: row.id }, status);
        await refresh();
      }}
      onDelete={async (row) => {
        await catalogApi.remove('course', { courseId: row.id });
        await refresh();
      }}
      onMove={async (row, direction) => {
        await catalogApi.move('course', { courseId: row.id }, direction);
        await refresh();
      }}
      onOpen={(row) => navigate(paths.admin.catalog.course(row.id))}
      openLabel="Levels"
    />
  );
}
