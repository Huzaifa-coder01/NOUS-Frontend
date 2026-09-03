import { useState } from 'react';

import { toast } from 'src/components/snackbar';

import { openFile, downloadFile, formatFileSize } from 'src/lib/file-store';

import { DocList as DocListRoot, DocItem, DocButton, EmptyState } from '../styles';

// ----------------------------------------------------------------------

const ICONS = { 'past-paper': '\u{1F4C4}', syllabus: '\u{1F4CB}', note: '\u{1F4DD}' };

function describe(doc) {
  if (doc.kind === 'past-paper') {
    return [
      [doc.session, doc.year].filter(Boolean).join(' '),
      doc.type,
      formatFileSize(doc.fileSize),
    ]
      .filter(Boolean)
      .join(' · ');
  }

  if (doc.kind === 'note') {
    return [`Shared by ${doc.uploadedBy?.name ?? 'a student'}`, formatFileSize(doc.fileSize)]
      .filter(Boolean)
      .join(' · ');
  }

  return formatFileSize(doc.fileSize);
}

// ----------------------------------------------------------------------

function DocRow({ doc }) {
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
    <DocItem>
      <div className="doc-icon">{ICONS[doc.kind] ?? '\u{1F4C4}'}</div>

      <div className="doc-body">
        <div className="doc-name" title={doc.name}>
          {doc.name}
        </div>
        <div className="doc-meta">{describe(doc)}</div>
      </div>

      <div className="doc-actions">
        <DocButton type="button" variant="primary" disabled={busy} onClick={run(openFile)}>
          Open
        </DocButton>
        <DocButton type="button" disabled={busy} onClick={run(downloadFile)}>
          Download
        </DocButton>
      </div>
    </DocItem>
  );
}

// ----------------------------------------------------------------------

/** `docs` must already be filtered to what the student may see. */
export function DocumentList({ docs, emptyTitle, emptyHint }) {
  if (!docs.length) {
    return (
      <EmptyState>
        <strong>{emptyTitle}</strong>
        {emptyHint}
      </EmptyState>
    );
  }

  return (
    <DocListRoot>
      {docs.map((doc) => (
        <DocRow key={doc.id} doc={doc} />
      ))}
    </DocListRoot>
  );
}
