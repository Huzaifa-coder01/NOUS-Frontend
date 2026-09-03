import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { docsApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';
import { DOC_LABELS, PAPER_TYPES, PAPER_SESSIONS } from 'src/_mock/_nous';

import { EntityList } from '../components/entity-list';
import { nameColumn, fileColumn, paperColumns, uploadedColumn } from '../components/doc-columns';

// ----------------------------------------------------------------------

const NAME_FIELD = {
  name: 'name',
  label: 'PDF name',
  required: true,
  helperText: 'Must be unique across the whole system',
};

const FILE_FIELD = {
  name: 'file',
  type: 'file',
  label: 'Replace PDF (optional)',
  helperText: 'Leave empty to keep the current file',
};

const PAPER_FIELDS = [
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
];

/** Where each document lives - the whole point of these cross-catalog modules. */
const locationColumn = {
  id: 'courseName',
  label: 'Course / level / subject / chapter',
  render: (row) => (
    <>
      <Typography variant="body2">
        {row.courseName} · {row.levelName}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {row.subjectName}
        {row.chapterName ? ` · ${row.chapterName}` : ' · whole subject'}
      </Typography>
    </>
  ),
};

// ----------------------------------------------------------------------

/**
 * A cross-catalog module for one document kind: every past paper, syllabus or
 * student note in the system on one searchable page, with its full course /
 * level / subject / chapter context.
 *
 * This is the notes management module the admin needs - students upload notes
 * from the chapter page, and everything else about them happens here.
 */
export function AdminAllDocsView({ kind, heading, subheading }) {
  const { courses, refresh } = useNousData();

  const navigate = useNavigate();

  const [rows, setRows] = useState([]);

  useEffect(() => {
    let live = true;

    docsApi
      .listAll(kind)
      .then((next) => {
        if (live) setRows(next);
      })
      .catch((error) => console.error('[admin] documents load failed:', error));

    return () => {
      live = false;
    };
    // re-runs after every catalog refresh
  }, [kind, courses]);

  const columns = [
    nameColumn,
    locationColumn,
    ...(kind === 'past-paper' ? paperColumns : []),
    ...(kind === 'note' ? [uploadedColumn] : []),
    fileColumn,
  ];

  const openOwner = (row) =>
    navigate(
      row.chapterName
        ? paths.admin.catalog.chapterSection(
            row.path.courseId,
            row.path.levelId,
            row.path.subjectId,
            row.path.chapterId,
            kind === 'past-paper' ? 'past-papers' : kind === 'note' ? 'notes' : 'syllabus'
          )
        : paths.admin.catalog.subjectPastPapers(
            row.path.courseId,
            row.path.levelId,
            row.path.subjectId
          )
    );

  return (
    <EntityList
      heading={heading}
      links={[{ name: 'Admin', href: paths.admin.root }, { name: heading }]}
      rows={rows}
      columns={columns}
      searchFields={[
        'name',
        'fileName',
        'courseName',
        'levelName',
        'subjectName',
        'chapterName',
        'session',
        'type',
      ]}
      searchPlaceholder={`Search ${DOC_LABELS[kind].plural.toLowerCase()}, course, subject or chapter...`}
      fields={() => [NAME_FIELD, FILE_FIELD, ...(kind === 'past-paper' ? PAPER_FIELDS : [])]}
      editLabel="Edit PDF"
      describe={(row) => row.name}
      deleteNote="The PDF file is removed as well - this cannot be undone."
      // a document can be active yet still hidden because a parent is switched
      // off; filter on what a student would actually get
      statusOf={(row) => row.effectiveStatus}
      toValues={(row) => ({
        name: row.name,
        file: null,
        ...(kind === 'past-paper' ? { year: row.year, session: row.session, type: row.type } : {}),
      })}
      onUpdate={async (row, values) => {
        await docsApi.update(kind, row.path, row.id, values);
        await refresh();
      }}
      onToggleStatus={async (row, status) => {
        await docsApi.setStatus(kind, row.path, row.id, status);
        await refresh();
      }}
      onDelete={async (row) => {
        await docsApi.remove(kind, row.path, row.id);
        await refresh();
      }}
      onOpen={openOwner}
      openLabel="Go to"
      toolbar={
        subheading && (
          <Typography sx={{ px: 2.5, pb: 2.5, fontSize: 14, color: 'text.secondary' }}>
            {subheading}
          </Typography>
        )
      }
    />
  );
}
