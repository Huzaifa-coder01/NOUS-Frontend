import { useNavigate } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { catalogApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';
import { countActive, chapterDocs } from 'src/utils/catalog';
import { STATUS_OPTIONS, CHAPTER_SECTIONS } from 'src/_mock/_nous';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { EntityList } from '../components/entity-list';

// ----------------------------------------------------------------------

const FIELDS = [
  { name: 'name', label: 'Chapter label', required: true, helperText: 'e.g. "Chapter 11"' },
  { name: 'title', label: 'Chapter title', helperText: 'Shown in bold on the chapter list' },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
];

const fieldsFor = (isEdit) => (isEdit ? FIELDS.filter((field) => field.name !== 'status') : FIELDS);

const DELETE_NOTE =
  'Its past papers, syllabus and notes are kept in the database and switched to inactive.';

// ----------------------------------------------------------------------

export function AdminSubjectView({ course, level, subject }) {
  const { refresh } = useNousData();

  const navigate = useNavigate();

  const path = { courseId: course.id, levelId: level.id, subjectId: subject.id };

  const columns = [
    {
      id: 'name',
      label: 'Chapter',
      width: 160,
      render: (row) => (
        <>
          <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
            {row.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            /{row.id}
          </Typography>
        </>
      ),
    },
    { id: 'title', label: 'Title' },
    {
      id: 'documents',
      label: 'Syllabus · Notes · Papers',
      width: 220,
      render: (row) => (
        <Stack direction="row" spacing={0.75}>
          {CHAPTER_SECTIONS.map((section) => {
            const docs = chapterDocs(row, section.kind);

            return (
              <Label
                key={section.id}
                color={countActive(docs) ? 'success' : 'default'}
                title={section.name}
              >
                {section.icon} {countActive(docs)}/{docs.length}
              </Label>
            );
          })}
        </Stack>
      ),
    },
  ];

  return (
    <EntityList
      heading="Chapters"
      links={[
        { name: 'Admin', href: paths.admin.root },
        { name: 'Catalog', href: paths.admin.catalog.root },
        { name: course.name, href: paths.admin.catalog.course(course.id) },
        { name: level.name, href: paths.admin.catalog.level(course.id, level.id) },
        { name: subject.name },
      ]}
      rows={subject.chapters}
      columns={columns}
      searchFields={['name', 'title']}
      searchPlaceholder="Search chapter..."
      createLabel="New chapter"
      fields={fieldsFor}
      editLabel="Edit chapter"
      cascades
      deleteNote={DELETE_NOTE}
      emptyValues={{
        name: `Chapter ${subject.chapters.length + 1}`,
        title: `${subject.name} - Chapter ${subject.chapters.length + 1}`,
        status: STATUS_OPTIONS[0].value,
      }}
      toValues={(row) => ({ name: row.name, title: row.title })}
      describe={(row) => row.title ?? row.name}
      onCreate={async (values) => {
        await catalogApi.create('chapter', path, values);
        await refresh();
      }}
      onUpdate={async (row, values) => {
        await catalogApi.update('chapter', { ...path, chapterId: row.id }, values);
        await refresh();
      }}
      onToggleStatus={async (row, status) => {
        await catalogApi.setStatus('chapter', { ...path, chapterId: row.id }, status);
        await refresh();
      }}
      onDelete={async (row) => {
        await catalogApi.remove('chapter', { ...path, chapterId: row.id });
        await refresh();
      }}
      onMove={async (row, direction) => {
        await catalogApi.move('chapter', { ...path, chapterId: row.id }, direction);
        await refresh();
      }}
      onOpen={(row) =>
        navigate(paths.admin.catalog.chapter(course.id, level.id, subject.id, row.id))
      }
      openLabel="Content"
      extraActions={
        <Button
          color="inherit"
          variant="outlined"
          sx={{ flexShrink: 0 }}
          startIcon={<Iconify icon="solar:documents-bold" />}
          onClick={() =>
            navigate(paths.admin.catalog.subjectPastPapers(course.id, level.id, subject.id))
          }
        >
          Subject past papers
        </Button>
      }
    />
  );
}
