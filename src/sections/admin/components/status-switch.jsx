import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label';

import { STATUS } from 'src/_mock/_nous';

// ----------------------------------------------------------------------

/**
 * Active / inactive toggle used on every admin list.
 *
 * `hiddenByParent` marks a row that is active in its own right but still not
 * visible to students because something above it is switched off - worth
 * saying out loud, otherwise the admin sees "Active" and expects it live.
 */
export function StatusSwitch({ row, onToggle, hiddenByParent = false, cascades = false }) {
  const [busy, setBusy] = useState(false);

  const active = row.status === STATUS.active;

  const handleChange = async (event) => {
    const next = event.target.checked ? STATUS.active : STATUS.inactive;

    setBusy(true);

    try {
      await onToggle(row, next);

      toast.success(
        next === STATUS.active
          ? 'Now active'
          : cascades
            ? 'Now inactive - everything under it was switched off too'
            : 'Now inactive'
      );
    } catch (error) {
      toast.error(error?.message ?? 'Could not change the status');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Switch size="small" checked={active} disabled={busy} onChange={handleChange} />

      {hiddenByParent ? (
        <Tooltip title="Active, but a parent is inactive so students cannot see it">
          <span>
            <Label color="warning">Hidden</Label>
          </span>
        </Tooltip>
      ) : (
        <Label color={active ? 'success' : 'default'}>{active ? 'Active' : 'Inactive'}</Label>
      )}
    </Stack>
  );
}
