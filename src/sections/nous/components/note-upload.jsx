import { useRef, useState } from 'react';

import { toast } from 'src/components/snackbar';

import { notesApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';
import { MAX_FILE_SIZE, formatFileSize } from 'src/lib/file-store';

import { useAuthContext } from 'src/auth/hooks';

import { UploadCard, UploadInput, FilePicker, DocButton } from '../styles';

// ----------------------------------------------------------------------

const MAX_MB = Math.round(MAX_FILE_SIZE / (1024 * 1024));

/**
 * Uploading a note is the only write a student can make. Once saved the note is
 * active immediately and appears for every student on this chapter, not just
 * the person who uploaded it.
 */
export function NoteUpload({ path }) {
  const { refresh } = useNousData();

  const { user } = useAuthContext();

  const inputRef = useRef(null);

  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setFile(null);
    setError('');

    if (inputRef.current) inputRef.current.value = '';
  };

  const handlePick = (event) => {
    const picked = event.target.files?.[0] ?? null;

    setError('');

    if (!picked) {
      setFile(null);
      return;
    }

    if (picked.type !== 'application/pdf') {
      setError('Notes must be a PDF file.');
      setFile(null);
      return;
    }

    if (picked.size > MAX_FILE_SIZE) {
      setError(`This PDF is ${formatFileSize(picked.size)} - the limit is ${MAX_MB}MB.`);
      setFile(null);
      return;
    }

    setFile(picked);

    // the PDF name doubles as the title unless the student types their own
    if (!name.trim()) setName(picked.name.replace(/\.pdf$/i, ''));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!file) {
      setError('Choose a PDF to upload.');
      return;
    }

    if (!name.trim()) {
      setError('Give this note a name.');
      return;
    }

    setSaving(true);

    try {
      await notesApi.upload(path, { name: name.trim(), file }, user);
      await refresh();

      toast.success('Note uploaded - every student can see it now');
      reset();
    } catch (uploadError) {
      // most often the unique-name rule
      setError(uploadError?.message ?? 'Could not upload this note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <UploadCard onSubmit={handleSubmit}>
      <h3>Share your notes</h3>
      <p className="upload-hint">
        Upload a PDF for this chapter. Every PDF needs a name that is not already used anywhere in
        the system, and it becomes visible to all students straight away.
      </p>

      <div className="upload-row">
        <UploadInput
          value={name}
          maxLength={160}
          placeholder="Note name"
          onChange={(event) => setName(event.target.value)}
        />

        <FilePicker>
          <input ref={inputRef} type="file" accept="application/pdf" onChange={handlePick} />
          {file ? '\u{1F4CE} ' : '\u{2B06}\u{FE0F} '}
          {file ? <span className="file-name">{file.name}</span> : 'Choose PDF'}
        </FilePicker>

        <DocButton type="submit" variant="primary" disabled={saving}>
          {saving ? 'Uploading...' : 'Upload note'}
        </DocButton>
      </div>

      {!!error && <div className="upload-error">{error}</div>}
    </UploadCard>
  );
}
