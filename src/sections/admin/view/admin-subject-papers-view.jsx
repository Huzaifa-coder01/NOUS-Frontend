import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { catalogApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';
import { PAPER_TYPES, PAPER_STATUS, PAPER_SESSIONS } from 'src/_mock/_nous';

import { Label } from 'src/components/label';

import { EntityList } from '../components/entity-list';

// ----------------------------------------------------------------------

const currentYear = new Date().getFullYear();

const FIELDS = [
  { name: 'title', label: 'Paper title', required: true },
  { name: 'year', label: 'Year', type: 'number', required: true },
  {
    name: 'session',
    label: 'Session',
    type: 'select',
    options: PAPER_SESSIONS.map((value) => ({ value, label: value })),
  },
  {
    name: 'type',
    label: 'Paper type',
    type: 'select',
    options: PAPER_TYPES.map((value) => ({ value, label: value })),
  },
  { name: 'durationMins', label: 'Duration (minutes)', type: 'number' },
  { name: 'totalMarks', label: 'Total marks', type: 'number' },
  { name: 'fileUrl', label: 'File URL', helperText: 'Link to the PDF students download' },
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
    label: 'Paper',
    render: (row) => (
      <>
        <Typography variant="subtitle2">{row.title}</Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {row.type}
        </Typography>
      </>
    ),
  },
  { id: 'session', label: 'Session', width: 120 },
  { id: 'year', label: 'Year', width: 100 },
  {
    id: 'totalMarks',
    label: 'Marks',
    width: 100,
    render: (row) => `${row.totalMarks || '—'}`,
  },
  {
    id: 'fileUrl',
    label: 'File',
    width: 120,
    render: (row) =>
      row.fileUrl ? (
        <Link href={row.fileUrl} target="_blank" rel="noopener" variant="body2">
          Open
        </Link>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          None
        </Typography>
      ),
  },
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

/** Past papers that belong to a whole subject (full exam sittings). */
export function AdminSubjectPapersView({ program, level, subject }) {
  const { refresh } = useNousData();

  return (
    <EntityList
      heading="Past papers"
      links={[
        { name: 'Admin', href: paths.admin.root },
        { name: 'Catalog', href: paths.admin.catalog.root },
        { name: program.name, href: paths.admin.catalog.program(program.id) },
        { name: level.name, href: paths.admin.catalog.level(program.id, level.id) },
        { name: subject.name, href: paths.admin.catalog.subject(program.id, level.id, subject.id) },
        { name: 'Past papers' },
      ]}
      rows={subject.pastPapers ?? []}
      columns={COLUMNS}
      searchFields={['title', 'session', 'type']}
      searchPlaceholder="Search paper..."
      createLabel="New past paper"
      fields={FIELDS}
      describe={(row) => row.title}
      emptyValues={{
        title: `${subject.name} — `,
        year: currentYear,
        session: PAPER_SESSIONS[0],
        type: PAPER_TYPES[0],
        durationMins: 180,
        totalMarks: 100,
        fileUrl: '',
        status: 'published',
      }}
      toValues={(row) => ({
        title: row.title,
        year: row.year,
        session: row.session,
        type: row.type,
        durationMins: row.durationMins,
        totalMarks: row.totalMarks,
        fileUrl: row.fileUrl,
        status: row.status,
      })}
      onCreate={async (values) => {
        await catalogApi.createSubjectPaper(program.id, level.id, subject.id, values);
        await refresh();
      }}
      onUpdate={async (row, values) => {
        await catalogApi.updateSubjectPaper(program.id, level.id, subject.id, row.id, values);
        await refresh();
      }}
      onDelete={async (row) => {
        await catalogApi.deleteSubjectPaper(program.id, level.id, subject.id, row.id);
        await refresh();
      }}
    />
  );
}
