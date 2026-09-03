import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useNousData } from 'src/context/nous-data';

import { Label } from 'src/components/label';

import { EntityList } from '../components/entity-list';

// ----------------------------------------------------------------------

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
  {
    id: 'subjectName',
    label: 'Subject',
    render: (row) => (
      <>
        <Typography variant="body2">{row.subjectName}</Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {row.programName} · {row.levelName}
        </Typography>
      </>
    ),
  },
  { id: 'session', label: 'Session', width: 110 },
  { id: 'year', label: 'Year', width: 90 },
  {
    id: 'fileUrl',
    label: 'File',
    width: 100,
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
    width: 110,
    render: (row) => (
      <Label color={row.status === 'published' ? 'success' : 'warning'}>{row.status}</Label>
    ),
  },
];

// ----------------------------------------------------------------------

/**
 * The past papers module: every subject paper in the catalog on one paginated,
 * searchable page. Editing happens on the owning subject, so rows link there.
 */
export function AdminPastPapersView() {
  const { programs } = useNousData();

  const navigate = useNavigate();

  const rows = useMemo(
    () =>
      programs.flatMap((program) =>
        program.levels.flatMap((level) =>
          level.subjects.flatMap((subject) =>
            (subject.pastPapers ?? []).map((paper) => ({
              ...paper,
              id: `${program.id}/${level.id}/${subject.id}/${paper.id}`,
              programId: program.id,
              levelId: level.id,
              subjectId: subject.id,
              programName: program.name,
              levelName: level.name,
              subjectName: subject.name,
            }))
          )
        )
      ),
    [programs]
  );

  return (
    <EntityList
      heading="Past papers"
      links={[{ name: 'Admin', href: paths.admin.root }, { name: 'Past papers' }]}
      rows={rows}
      columns={COLUMNS}
      searchFields={['title', 'subjectName', 'programName', 'levelName', 'session', 'type']}
      searchPlaceholder="Search by paper, subject or program..."
      onOpen={(row) =>
        navigate(paths.admin.catalog.subjectPapers(row.programId, row.levelId, row.subjectId))
      }
      openLabel="Manage"
    />
  );
}
