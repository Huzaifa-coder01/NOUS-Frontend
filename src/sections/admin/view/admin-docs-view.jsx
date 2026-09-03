import { paths } from 'src/routes/paths';

import { docsApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';
import { DOC_LABELS, PAPER_TYPES, STATUS_OPTIONS, PAPER_SESSIONS } from 'src/_mock/_nous';

import { EntityList } from '../components/entity-list';
import { nameColumn, fileColumn, paperColumns, uploadedColumn } from '../components/doc-columns';

// ----------------------------------------------------------------------

const currentYear = new Date().getFullYear();

const NAME_FIELD = {
  name: 'name',
  label: 'PDF name',
  required: true,
  helperText: 'Must be unique across the whole system',
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

const STATUS_FIELD = { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS };

function fieldsFor(kind) {
  return (isEdit) => [
    NAME_FIELD,
    {
      name: 'file',
      type: 'file',
      label: isEdit ? 'Replace PDF (optional)' : 'Choose PDF',
      helperText: isEdit ? 'Leave empty to keep the current file' : undefined,
    },
    ...(kind === 'past-paper' ? PAPER_FIELDS : []),
    ...(isEdit ? [] : [STATUS_FIELD]),
  ];
}

// ----------------------------------------------------------------------

/**
 * One PDF list, used for every scope: subject past papers, and the syllabus /
 * notes / past papers of a chapter. `path` decides the filter, so a chapter
 * list only ever shows PDFs for that course + level + subject + chapter.
 *
 * Notes are the one kind an admin cannot create - students upload those - so
 * the create button is left off.
 */
export function AdminDocsView({ kind, path, heading, links, rows }) {
  const { refresh } = useNousData();

  const columns = [
    nameColumn,
    ...(kind === 'past-paper' ? paperColumns : []),
    ...(kind === 'note' ? [uploadedColumn] : []),
    fileColumn,
  ];

  const canCreate = kind !== 'note';

  return (
    <EntityList
      heading={heading}
      links={links}
      rows={rows ?? []}
      columns={columns}
      searchFields={['name', 'fileName', 'session', 'type']}
      searchPlaceholder={`Search ${DOC_LABELS[kind].plural.toLowerCase()}...`}
      createLabel={`New ${DOC_LABELS[kind].singular.toLowerCase()}`}
      fields={fieldsFor(kind)}
      editLabel="Edit PDF"
      describe={(row) => row.name}
      deleteNote="The PDF file is removed as well - this cannot be undone."
      emptyValues={{
        name: '',
        file: null,
        status: STATUS_OPTIONS[0].value,
        ...(kind === 'past-paper'
          ? { year: currentYear, session: PAPER_SESSIONS[0], type: PAPER_TYPES[0] }
          : {}),
      }}
      toValues={(row) => ({
        name: row.name,
        file: null,
        ...(kind === 'past-paper' ? { year: row.year, session: row.session, type: row.type } : {}),
      })}
      onCreate={
        canCreate
          ? async (values) => {
              await docsApi.create(kind, path, values);
              await refresh();
            }
          : undefined
      }
      onUpdate={async (row, values) => {
        await docsApi.update(kind, path, row.id, values);
        await refresh();
      }}
      onToggleStatus={async (row, status) => {
        await docsApi.setStatus(kind, path, row.id, status);
        await refresh();
      }}
      onDelete={async (row) => {
        await docsApi.remove(kind, path, row.id);
        await refresh();
      }}
    />
  );
}

// ----------------------------------------------------------------------

/** Breadcrumb trail shared by the chapter level document screens. */
export function docLinks({ course, level, subject, chapter, current }) {
  return [
    { name: 'Admin', href: paths.admin.root },
    { name: 'Catalog', href: paths.admin.catalog.root },
    { name: course.name, href: paths.admin.catalog.course(course.id) },
    { name: level.name, href: paths.admin.catalog.level(course.id, level.id) },
    { name: subject.name, href: paths.admin.catalog.subject(course.id, level.id, subject.id) },
    ...(chapter
      ? [
          {
            name: chapter.name,
            href: paths.admin.catalog.chapter(course.id, level.id, subject.id, chapter.id),
          },
        ]
      : []),
    { name: current },
  ];
}
