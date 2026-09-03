import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { catalogApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';
import { countActive, flattenTree, chapterDocs } from 'src/utils/catalog';

import { CHAPTER_SECTIONS } from 'src/_mock/_nous';

import { Label } from 'src/components/label';

import { EntityList } from '../components/entity-list';

// ----------------------------------------------------------------------

/** Where the node sits in the catalog - the reason these modules exist. */
function locationColumn(label, render) {
  return { id: 'courseName', label, render };
}

const nameColumn = (label) => ({
  id: 'name',
  label,
  render: (row) => (
    <>
      <Typography variant="subtitle2">{row.name}</Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        /{row.id}
      </Typography>
    </>
  ),
});

const ratio = (label, width, pick) => ({
  id: label.toLowerCase(),
  label,
  width,
  render: (row) => {
    const list = pick(row);

    return (
      <Label color={countActive(list) ? 'success' : 'default'}>
        {countActive(list)}/{list.length}
      </Label>
    );
  },
});

// ----------------------------------------------------------------------

const CONFIG = {
  level: {
    heading: 'Levels',
    editLabel: 'Edit level',
    subheading:
      'Every level in the system, whichever course it belongs to. Add new levels from the course they sit under.',
    fields: [{ name: 'name', label: 'Level name', required: true }],
    searchFields: ['name', 'courseName'],
    searchPlaceholder: 'Search levels or courses...',
    columns: [
      nameColumn('Level'),
      locationColumn('Course', (row) => <Typography variant="body2">{row.courseName}</Typography>),
      ratio('Subjects', 130, (row) => row.subjects ?? []),
      {
        id: 'chapters',
        label: 'Chapters',
        width: 110,
        render: (row) =>
          (row.subjects ?? []).reduce((total, subject) => total + subject.chapters.length, 0),
      },
    ],
    toValues: (row) => ({ name: row.name }),
    open: (row) => paths.admin.catalog.level(row.path.courseId, row.path.levelId),
    openLabel: 'Subjects',
    deleteNote:
      'Its subjects, chapters, past papers, syllabus and notes are kept in the database and switched to inactive.',
  },

  subject: {
    heading: 'Subjects',
    editLabel: 'Edit subject',
    subheading:
      'Every subject in the system, whichever course and level it belongs to. Add new subjects from the level they sit under.',
    fields: [{ name: 'name', label: 'Subject name', required: true }],
    searchFields: ['name', 'courseName', 'levelName'],
    searchPlaceholder: 'Search subjects, courses or levels...',
    columns: [
      nameColumn('Subject'),
      locationColumn('Course / level', (row) => (
        <>
          <Typography variant="body2">{row.courseName}</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {row.levelName}
          </Typography>
        </>
      )),
      ratio('Chapters', 130, (row) => row.chapters ?? []),
      ratio('Papers', 120, (row) => row.pastPapers ?? []),
    ],
    toValues: (row) => ({ name: row.name }),
    open: (row) =>
      paths.admin.catalog.subject(row.path.courseId, row.path.levelId, row.path.subjectId),
    openLabel: 'Chapters',
    deleteNote:
      'Its chapters, past papers, syllabus and notes are kept in the database and switched to inactive.',
  },

  chapter: {
    heading: 'Chapters',
    editLabel: 'Edit chapter',
    subheading:
      'Every chapter in the system, whichever subject it belongs to. Add new chapters from the subject they sit under.',
    fields: [
      { name: 'name', label: 'Chapter label', required: true, helperText: 'e.g. "Chapter 11"' },
      { name: 'title', label: 'Chapter title' },
    ],
    searchFields: ['name', 'title', 'courseName', 'levelName', 'subjectName'],
    searchPlaceholder: 'Search chapters, subjects, levels or courses...',
    columns: [
      {
        id: 'name',
        label: 'Chapter',
        render: (row) => (
          <>
            <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
              {row.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {row.title || `/${row.id}`}
            </Typography>
          </>
        ),
      },
      locationColumn('Course / level / subject', (row) => (
        <>
          <Typography variant="body2">
            {row.courseName} · {row.levelName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {row.subjectName}
          </Typography>
        </>
      )),
      {
        id: 'documents',
        label: 'Syllabus · Notes · Papers',
        width: 230,
        render: (row) => (
          <Stack direction="row" spacing={0.75}>
            {CHAPTER_SECTIONS.map((section) => {
              const docs = chapterDocs(row, section.kind);

              return (
                <Label
                  key={section.id}
                  title={section.name}
                  color={countActive(docs) ? 'success' : 'default'}
                >
                  {section.icon} {countActive(docs)}/{docs.length}
                </Label>
              );
            })}
          </Stack>
        ),
      },
    ],
    toValues: (row) => ({ name: row.name, title: row.title }),
    describe: (row) => `${row.subjectName} - ${row.name}`,
    open: (row) =>
      paths.admin.catalog.chapter(
        row.path.courseId,
        row.path.levelId,
        row.path.subjectId,
        row.path.chapterId
      ),
    openLabel: 'Content',
    deleteNote:
      'Its past papers, syllabus and notes are kept in the database and switched to inactive.',
  },
};

// ----------------------------------------------------------------------

/**
 * One node type, listed across the whole catalog with the course / level /
 * subject it belongs to.
 *
 * Creating is deliberately left out: a new level, subject or chapter needs a
 * parent to sit under, so it is added from that parent's page. Everything else
 * - rename, activate, deactivate, delete - works from here.
 */
export function AdminAllNodesView({ type }) {
  const { adminCourses, refresh } = useNousData();

  const navigate = useNavigate();

  const config = CONFIG[type];

  const tree = useMemo(() => flattenTree(adminCourses), [adminCourses]);

  const rows = tree[`${type}s`];

  return (
    <EntityList
      heading={config.heading}
      links={[{ name: 'Admin', href: paths.admin.root }, { name: config.heading }]}
      rows={rows}
      columns={config.columns}
      searchFields={config.searchFields}
      searchPlaceholder={config.searchPlaceholder}
      fields={config.fields}
      editLabel={config.editLabel}
      cascades
      deleteNote={config.deleteNote}
      describe={config.describe}
      // a node can be active yet unreachable because a parent is off, so the
      // status tabs filter on what a student would actually get
      statusOf={(row) => row.effectiveStatus}
      toValues={config.toValues}
      onUpdate={async (row, values) => {
        await catalogApi.update(type, row.path, values);
        await refresh();
      }}
      onToggleStatus={async (row, status) => {
        await catalogApi.setStatus(type, row.path, status);
        await refresh();
      }}
      onDelete={async (row) => {
        await catalogApi.remove(type, row.path);
        await refresh();
      }}
      onOpen={(row) => navigate(config.open(row))}
      openLabel={config.openLabel}
      toolbar={
        <Typography sx={{ px: 2.5, pb: 2.5, fontSize: 14, color: 'text.secondary' }}>
          {config.subheading}
        </Typography>
      }
    />
  );
}
