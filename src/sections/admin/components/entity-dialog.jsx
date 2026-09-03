import { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

/**
 * Generic create/edit dialog driven by a field config:
 * `[{ name, label, type?: 'text' | 'number' | 'select' | 'multiline', options?, required?, helperText? }]`
 */
export function EntityDialog({ open, title, fields = [], initialValues, submitLabel = 'Save', onClose, onSubmit }) {
  const [values, setValues] = useState(initialValues ?? {});
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? {});
      setErrorMessage('');
      setSubmitting(false);
    }
  }, [open, initialValues]);

  const handleChange = (name) => (event) =>
    setValues((prev) => ({ ...prev, [name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      setErrorMessage(error?.message ?? 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {!!errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            {fields.map((field) => (
              <TextField
                key={field.name}
                fullWidth
                select={field.type === 'select'}
                multiline={field.type === 'multiline'}
                minRows={field.type === 'multiline' ? field.minRows ?? 6 : undefined}
                type={field.type === 'number' ? 'number' : 'text'}
                label={field.label}
                required={field.required}
                helperText={field.helperText}
                value={values[field.name] ?? ''}
                onChange={handleChange(field.name)}
              >
                {field.type === 'select' &&
                  field.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
              </TextField>
            ))}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
