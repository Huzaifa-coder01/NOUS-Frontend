/**
 * PDF storage for the mock backend.
 *
 * The catalog metadata lives in localStorage (see `mock-server.js`), but PDF
 * bytes would blow through its ~5MB quota after a handful of uploads, so the
 * files themselves go into IndexedDB and the catalog only keeps a `fileId`.
 *
 * Against a real API this becomes a multipart upload and `fileId` becomes the
 * key the server hands back.
 */

const DB_NAME = 'nous.files';

const DB_VERSION = 1;

const STORE = 'files';

/** Uploads larger than this are rejected before they reach the browser store. */
export const MAX_FILE_SIZE = 15 * 1024 * 1024;

export const ACCEPTED_MIME = 'application/pdf';

let connection = null;

function open() {
  if (connection) return connection;

  connection = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return connection;
}

function run(mode, handler) {
  return open().then(
    (database) =>
      new Promise((resolve, reject) => {
        const tx = database.transaction(STORE, mode);
        const store = tx.objectStore(STORE);

        let result;

        try {
          result = handler(store);
        } catch (error) {
          reject(error);
          return;
        }

        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

// ----------------------------------------------------------------------

let counter = 0;

export function nextFileId() {
  counter += 1;

  return `file-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export const fileStore = {
  /** Stores one blob and returns the record the catalog should keep. */
  async put(blob, { id = nextFileId(), name, mimeType = ACCEPTED_MIME } = {}) {
    await run('readwrite', (store) => store.put({ id, blob, name, mimeType }));

    return { fileId: id, fileName: name, fileSize: blob.size, mimeType };
  },

  /** One transaction for the whole seed - a put per file is far too slow. */
  async putMany(entries) {
    await run('readwrite', (store) => {
      entries.forEach((entry) => store.put(entry));
    });

    return entries.map((entry) => entry.id);
  },

  async get(id) {
    if (!id) return null;

    const database = await open();

    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(id);

      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  },

  async remove(id) {
    if (!id) return;

    await run('readwrite', (store) => store.delete(id));
  },

  async clear() {
    await run('readwrite', (store) => store.clear());
  },
};

// ----------------------------------------------------------------------

async function blobUrl(fileId) {
  const record = await fileStore.get(fileId);

  if (!record?.blob) return null;

  return URL.createObjectURL(record.blob);
}

/**
 * Opens a stored PDF in a new tab. The tab is opened synchronously - before the
 * IndexedDB round trip - so the browser still credits it to the user's click.
 */
export async function openFile(doc) {
  const tab = window.open('', '_blank', 'noopener');

  const url = await blobUrl(doc?.fileId);

  if (!url) {
    tab?.close();
    throw new Error('This PDF is no longer available');
  }

  if (tab) {
    tab.location.href = url;
  } else {
    window.location.href = url;
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadFile(doc) {
  const url = await blobUrl(doc?.fileId);

  if (!url) throw new Error('This PDF is no longer available');

  const link = document.createElement('a');

  link.href = url;
  link.download = doc.fileName || `${doc.name}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function formatFileSize(bytes) {
  if (!bytes) return '—';

  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
