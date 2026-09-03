import { useNavigate } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { catalogApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { EntityList } from '../components/entity-list';

// ----------------------------------------------------------------------

const FIELDS = [
  { name: 'name', label: 'Chapter label', required: true, helperText: 'e.g. "Chapter 11"' },
  { name: 'title', label: 'Chapter title', helperText: 'Shown in bold on the chapter list' },
];

// ----------------------------------------------------------------------

export function AdminSubjectView({ program, level, subject }) {
  const { refresh } = useNousData();

  const navigate = useNavigate();

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
      id: 'resources',
      label: 'Content',
      width: 140,
      render: (row) => {
        const resources = row.resources ?? [];
        const published = resources.filter((item) => item.content?.trim()).length;

        return (
          <Label color={published ? 'success' : 'default'}>
            {published}/{resources.length}
          </Label>
        );
      },
    },
    {
      id: 'pastPapers',
      label: 'Past papers',
      width: 180,
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Label color={(row.pastPapers ?? []).length ? 'success' : 'default'}>
            {(row.pastPapers ?? []).length}
          </Label>

          <Button
            size="small"
            color="inherit"
            startIcon={<Iconify icon="solar:document-text-bold" />}
            onClick={() =>
              navigate(paths.admin.catalog.chapterPapers(program.id, level.id, subject.id, row.id))
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
      heading="Chapters"
      links={[
        { name: 'Admin', href: paths.admin.root },
        { name: 'Catalog', href: paths.admin.catalog.root },
        { name: program.name, href: paths.admin.catalog.program(program.id) },
        { name: level.name, href: paths.admin.catalog.level(program.id, level.id) },
        { name: subject.name },
      ]}
      rows={subject.chapters}
      columns={columns}
      searchFields={['name', 'title']}
      searchPlaceholder="Search chapter..."
      createLabel="New chapter"
      fields={FIELDS}
      emptyValues={{
        name: `Chapter ${subject.chapters.length + 1}`,
        title: `${subject.name} - Chapter ${subject.chapters.length + 1}`,
      }}
      toValues={(row) => ({ name: row.name, title: row.title })}
      describe={(row) => row.title ?? row.name}
      onCreate={async (values) => {
        await catalogApi.createChapter(program.id, level.id, subject.id, values);
        await refresh();
      }}
      onUpdate={async (row, values) => {
        await catalogApi.updateChapter(program.id, level.id, subject.id, row.id, values);
        await refresh();
      }}
      onDelete={async (row) => {
        await catalogApi.deleteChapter(program.id, level.id, subject.id, row.id);
        await refresh();
      }}
      onMove={async (row, direction) => {
        await catalogApi.moveChapter(program.id, level.id, subject.id, row.id, direction);
        await refresh();
      }}
      onOpen={(row) =>
        navigate(paths.admin.catalog.chapter(program.id, level.id, subject.id, row.id))
      }
      openLabel="Content"
      extraActions={
        <Button
          color="inherit"
          variant="outlined"
          sx={{ flexShrink: 0 }}
          startIcon={<Iconify icon="solar:documents-bold" />}
          onClick={() => navigate(paths.admin.catalog.subjectPapers(program.id, level.id, subject.id))}
        >
          Subject past papers
        </Button>
      }
    />
  );
}
