import { useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useToast } from 'src/hooks/use-toast';

import { useNousData } from 'src/context/nous-data';
import { DashboardContent } from 'src/layouts/dashboard';
import { catalogApi, resetDatabase } from 'src/lib/mock-server';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { AdminPageHeader } from '../components/admin-page-header';

// ----------------------------------------------------------------------

const FIELDS = [
  { name: 'logoPrefix', label: 'Logo - dark part', helperText: 'Rendered in white' },
  { name: 'logoSuffix', label: 'Logo - accent part', helperText: 'Rendered in blue' },
  { name: 'headerNote', label: 'Header note' },
  { name: 'homeTitle', label: 'Home page title' },
  { name: 'homeSubtitle', label: 'Home page subtitle' },
  { name: 'footerText', label: 'Footer text' },
];

// ----------------------------------------------------------------------

export function AdminSettingsView() {
  const { settings, refresh } = useNousData();

  const { showToast, showError, toastNode } = useToast();

  const [values, setValues] = useState(settings ?? {});
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (settings) setValues(settings);
  }, [settings]);

  const handleChange = (name) => (event) =>
    setValues((prev) => ({ ...prev, [name]: event.target.value }));

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await catalogApi.updateSettings(values);
      await refresh();
      showToast('Site settings saved');
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setConfirmReset(false);

    try {
      await resetDatabase();
      await refresh();
      showToast('Demo data restored');
    } catch (error) {
      showError(error);
    }
  };

  return (
    <DashboardContent>
      <AdminPageHeader title="Settings" subtitle="Branding and copy used across the public site" />

      <Stack spacing={3} sx={{ maxWidth: 640 }}>
        <Card sx={{ p: 3 }} component="form" onSubmit={handleSave}>
          <Stack spacing={2.5}>
            {FIELDS.map((field) => (
              <TextField
                key={field.name}
                fullWidth
                label={field.label}
                helperText={field.helperText}
                value={values[field.name] ?? ''}
                onChange={handleChange(field.name)}
              />
            ))}

            <Stack direction="row" spacing={1.5}>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Save settings'}
              </Button>
              <Button color="inherit" onClick={() => setValues(settings ?? {})}>
                Reset form
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Demo data
          </Typography>

          <Typography sx={{ mb: 2, fontSize: 14, color: 'text.secondary' }}>
            The catalog, users and settings live in this browser&apos;s local storage, and uploaded
            PDFs in IndexedDB. Restoring wipes every change and re-seeds the original CA &amp; ACCA
            data.
          </Typography>

          <Button variant="outlined" color="error" onClick={() => setConfirmReset(true)}>
            Restore demo data
          </Button>
        </Card>
      </Stack>

      <ConfirmDialog
        open={confirmReset}
        title="Restore demo data"
        content="Every course, chapter, PDF and account you created will be deleted, including uploaded files."
        onClose={() => setConfirmReset(false)}
        action={
          <Button variant="contained" color="error" onClick={handleReset}>
            Restore
          </Button>
        }
      />

      {toastNode}
    </DashboardContent>
  );
}
