import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { openFile, downloadFile, formatFileSize } from 'src/lib/file-store';

// ----------------------------------------------------------------------

export function DocFileActions({ doc }) {
  const [busy, setBusy] = useState(false);

  const run = (action) => async () => {
    setBusy(true);

    try {
      await action(doc);
    } catch (error) {
      toast.error(error?.message ?? 'Could not open this PDF');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack direction="row" spacing={0.5}>
      <Button
        size="small"
        color="inherit"
        disabled={busy}
        onClick={run(openFile)}
        startIcon={<Iconify icon="solar:eye-bold" />}
      >
        Open
      </Button>
      <Button size="small" color="inherit" disabled={busy} onClick={run(downloadFile)}>
        Save
      </Button>
    </Stack>
  );
}

// ----------------------------------------------------------------------

/** Name + stored file name, shared by every document list. */
export const nameColumn = {
  id: 'name',
  label: 'PDF',
  render: (row) => (
    <>
      <Typography variant="subtitle2">{row.name}</Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {row.fileName} · {formatFileSize(row.fileSize)}
      </Typography>
    </>
  ),
};

export const fileColumn = {
  id: 'fileName',
  label: 'File',
  width: 170,
  render: (row) => <DocFileActions doc={row} />,
};

export const uploadedColumn = {
  id: 'uploadedBy',
  label: 'Uploaded by',
  width: 190,
  render: (row) => (
    <>
      <Typography variant="body2">{row.uploadedBy?.name ?? 'Unknown'}</Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {row.uploadedBy?.role === 'admin' ? 'Admin' : 'Student'}
        {row.createdAt ? ` · ${fDateTime(row.createdAt)}` : ''}
      </Typography>
    </>
  ),
};

export const paperColumns = [
  { id: 'session', label: 'Session', width: 110 },
  { id: 'year', label: 'Year', width: 90 },
  { id: 'type', label: 'Type', width: 170 },
];
