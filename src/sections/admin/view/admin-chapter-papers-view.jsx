import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { catalogApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';
import { PAPER_STATUS, QUESTION_TYPES, PAPER_SESSIONS } from 'src/_mock/_nous';

import { Label } from 'src/components/label';

import { EntityList } from '../components/entity-list';

// ----------------------------------------------------------------------

const currentYear = new Date().getFullYear();

const FIELDS = [
  { name: 'title', label: 'Question title', required: true },
  { name: 'questionNo', label: 'Question no.', helperText: 'e.g. "Q3(b)"' },
  { name: 'year', label: 'Year', type: 'number', required: true },
  {
    name: 'session',
    label: 'Session',
    type: 'select',
    options: PAPER_SESSIONS.map((value) => ({ value, label: value })),
  },
  {
    name: 'type',
    label: 'Question type',
    type: 'select',
    options: QUESTION_TYPES.map((value) => ({ value, label: value })),
  },
  { name: 'marks', label: 'Marks', type: 'number' },
  {
    name: 'content',
    label: 'Question / answer',
    type: 'multiline',
    minRows: 6,
    helperText: 'Shown to signed-in students on the chapter past papers page',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: PAPER_STATUS.map((value) => ({ value, label: value })),
  },
];

const COLUMNS = [
  {
    id: 'title',
    label: 'Question',
    render: (row) => (
      <>
        <Typography variant="subtitle2">{row.title}</Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {row.type}
          {row.content?.trim() ? '' : ' · no text yet'}
        </Typography>
      </>
    ),
  },
  { id: 'questionNo', label: 'No.', width: 100 },
  { id: 'session', label: 'Session', width: 120 },
  { id: 'year', label: 'Year', width: 100 },
  { id: 'marks', label: 'Marks', width: 90 },
  {
    id: 'status',
    label: 'Status',
    width: 120,
    render: (row) => (
      <Label color={row.status === 'published' ? 'success' : 'warning'}>{row.status}</Label>
    ),
  },
];

// ----------------------------------------------------------------------

/** Past paper questions mapped onto a single chapter. */
export function AdminChapterPapersView({ program, level, subject, chapter }) {
  const { refresh } = useNousData();

  const ids = [program.id, level.id, subject.id, chapter.id];

  return (
    <EntityList
      heading="Chapter past papers"
      links={[
        { name: 'Admin', href: paths.admin.root },
        { name: 'Catalog', href: paths.admin.catalog.root },
        { name: program.name, href: paths.admin.catalog.program(program.id) },
        { name: level.name, href: paths.admin.catalog.level(program.id, level.id) },
        { name: subject.name, href: paths.admin.catalog.subject(program.id, level.id, subject.id) },
        { name: chapter.name, href: paths.admin.catalog.chapter(...ids) },
        { name: 'Past papers' },
      ]}
      rows={chapter.pastPapers ?? []}
      columns={COLUMNS}
      searchFields={['title', 'questionNo', 'session', 'type']}
      searchPlaceholder="Search question..."
      createLabel="New question"
      fields={FIELDS}
      describe={(row) => row.title}
      emptyValues={{
        title: '',
        questionNo: '',
        year: currentYear,
        session: PAPER_SESSIONS[0],
        type: QUESTION_TYPES[0],
        marks: 10,
        content: '',
        status: 'published',
      }}
      toValues={(row) => ({
        title: row.title,
        questionNo: row.questionNo,
        year: row.year,
        session: row.session,
        type: row.type,
        marks: row.marks,
        content: row.content,
        status: row.status,
      })}
      onCreate={async (values) => {
        await catalogApi.createChapterPaper(...ids, values);
        await refresh();
      }}
      onUpdate={async (row, values) => {
        await catalogApi.updateChapterPaper(...ids, row.id, values);
        await refresh();
      }}
      onDelete={async (row) => {
        await catalogApi.deleteChapterPaper(...ids, row.id);
        await refresh();
      }}
    />
  );
}
