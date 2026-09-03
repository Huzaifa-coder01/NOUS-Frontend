import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useToast } from 'src/hooks/use-toast';

import { catalogApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';
import { DashboardContent } from 'src/layouts/dashboard';
import { RESOURCE_ICONS } from 'src/_mock/_nous';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { EntityDialog } from '../components/entity-dialog';
import { AdminPageHeader } from '../components/admin-page-header';

// ----------------------------------------------------------------------

const FIELDS = [
  { name: 'name', label: 'Resource name', required: true },
  {
    name: 'icon',
    label: 'Icon',
    type: 'select',
    options: RESOURCE_ICONS.map((icon) => ({ value: icon, label: icon })),
  },
  { name: 'description', label: 'Short description' },
];

// ----------------------------------------------------------------------

function ResourceEditor({ resource, publicHref, onSave, onEdit, onDelete }) {
  const [content, setContent] = useState(resource.content ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(resource.content ?? '');
  }, [resource.content]);

  const dirty = content !== (resource.content ?? '');

  const handleSave = async () => {
    setSaving(true);
    await onSave(content);
    setSaving(false);
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box sx={{ fontSize: 28 }}>{resource.icon}</Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6">{resource.name}</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {resource.description || 'No description'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button size="small" component={RouterLink} href={publicHref} target="_blank">
            View
          </Button>
          <Button size="small" onClick={onEdit}>
            Edit
          </Button>
          <Button size="small" color="error" onClick={onDelete}>
            Delete
          </Button>
        </Stack>
      </Stack>

      <TextField
        fullWidth
        multiline
        minRows={6}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={`Write the ${resource.name.toLowerCase()} shown to signed-in students. Leave a blank line between paragraphs.`}
      />

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
        <Button variant="contained" disabled={!dirty || saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save content'}
        </Button>

        <Button color="inherit" disabled={!dirty} onClick={() => setContent(resource.content ?? '')}>
          Reset
        </Button>

        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          {resource.content?.trim() ? 'Published' : 'Empty - the public page shows a placeholder'}
        </Typography>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function AdminChapterView({ program, level, subject, chapter }) {
  const { refresh } = useNousData();

  const { showToast, showError, toastNode } = useToast();

  const [dialog, setDialog] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const ids = [program.id, level.id, subject.id, chapter.id];

  const handleSaveContent = async (resource, content) => {
    try {
      await catalogApi.updateResource(...ids, resource.id, { content });
      await refresh();
      showToast(`${resource.name} content saved`);
    } catch (error) {
      showError(error);
    }
  };

  const handleSubmit = async (values) => {
    if (dialog?.mode === 'edit') {
      await catalogApi.updateResource(...ids, dialog.row.id, values);
    } else {
      await catalogApi.createResource(...ids, values);
    }

    await refresh();
    showToast(dialog?.mode === 'edit' ? 'Resource updated' : 'Resource created');
  };

  const handleDelete = async () => {
    try {
      await catalogApi.deleteResource(...ids, confirm.id);
      await refresh();
      showToast('Resource deleted');
    } catch (error) {
      showError(error);
    } finally {
      setConfirm(null);
    }
  };

  return (
    <DashboardContent>
      <AdminPageHeader
        title={chapter.title || chapter.name}
        subtitle="Everything a student sees inside this chapter"
        links={[
          { name: 'Catalog', href: paths.admin.catalog.root },
          { name: program.name, href: paths.admin.catalog.program(program.id) },
          { name: level.name, href: paths.admin.catalog.level(program.id, level.id) },
          { name: subject.name, href: paths.admin.catalog.subject(program.id, level.id, subject.id) },
          { name: chapter.name },
        ]}
        action={{ label: 'New resource', onClick: () => setDialog({ mode: 'create' }) }}
      />

      <Stack spacing={3}>
        {(chapter.resources ?? []).map((resource) => (
          <ResourceEditor
            key={resource.id}
            resource={resource}
            publicHref={paths.nous.resource(...ids, resource.id)}
            onSave={(content) => handleSaveContent(resource, content)}
            onEdit={() => setDialog({ mode: 'edit', row: resource })}
            onDelete={() => setConfirm(resource)}
          />
        ))}

        {!(chapter.resources ?? []).length && (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <Typography sx={{ color: 'text.secondary' }}>
              This chapter has no resources yet.
            </Typography>
          </Card>
        )}
      </Stack>

      <EntityDialog
        open={!!dialog}
        title={dialog?.mode === 'edit' ? 'Edit resource' : 'New resource'}
        fields={FIELDS}
        initialValues={
          dialog?.mode === 'edit'
            ? {
                name: dialog.row.name,
                icon: dialog.row.icon,
                description: dialog.row.description,
              }
            : { name: '', icon: RESOURCE_ICONS[0], description: '' }
        }
        onClose={() => setDialog(null)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!confirm}
        title="Delete resource"
        content={`"${confirm?.name}" will be removed from this chapter.`}
        onClose={() => setConfirm(null)}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />

      {toastNode}
    </DashboardContent>
  );
}
