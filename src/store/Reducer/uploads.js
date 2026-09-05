import { createApi } from '@reduxjs/toolkit/query/react';

import { CONFIG } from 'src/config-global';

import { API_ROUTES } from '../apiRoutes';
import { unwrap, createCustomFetchBaseQuery } from '../baseQuery';

// ----------------------------------------------------------------------
// File uploads.
//
// `POST /upload/cloudinary` takes a multipart field named `files` (up to 10)
// and returns `{ file, fileUrl, fileExtension, publicId, resourceType }`. The
// relative `file` key is stored on a record; `fileUrl` is the delivery url.
//
// `/upload/aws` is the same handler under an older name, `/upload/azure` needs
// the AZURE_STORAGE_* vars, and `/upload` writes to the server's disk with a
// field named `file`. VITE_UPLOAD_DRIVER picks one.
// ----------------------------------------------------------------------

export const MAX_FILE_SIZE = 15 * 1024 * 1024;

export const ACCEPTED_MIME = 'application/pdf';

const DRIVERS = {
  cloudinary: { url: API_ROUTES.UPLOADS.CLOUDINARY, field: 'files' },
  aws: { url: API_ROUTES.UPLOADS.AWS, field: 'files' },
  azure: { url: API_ROUTES.UPLOADS.AZURE, field: 'files' },
  local: { url: API_ROUTES.UPLOADS.LOCAL, field: 'file' },
};

const driver = () => DRIVERS[CONFIG.api.uploadDriver] ?? DRIVERS.cloudinary;

/** The response is sometimes one object, sometimes a one-item list. */
function firstFile(response) {
  const data = unwrap(response);

  const record = Array.isArray(data) ? data[0] : data?.files?.[0] ?? data;

  return {
    file: record?.file ?? record?.key ?? record?.publicId ?? null,
    fileUrl: record?.fileUrl ?? record?.url ?? record?.secure_url ?? null,
    fileExtension: record?.fileExtension ?? null,
    publicId: record?.publicId ?? null,
    resourceType: record?.resourceType ?? null,
  };
}

export const uploadsApi = createApi({
  reducerPath: 'uploads',
  baseQuery: createCustomFetchBaseQuery(),
  endpoints: (builder) => ({
    /**
     * One file in, `{ file, fileUrl }` out. FormData is passed through
     * untouched so the browser sets the multipart boundary itself.
     */
    uploadFile: builder.mutation({
      query: (file) => {
        const { url, field } = driver();

        const body = new FormData();

        body.append(field, file, file.name);

        return { url, method: 'POST', body };
      },
      transformResponse: firstFile,
    }),

    /** Accepts the relative key, the bare public id, or the full url. */
    deleteFile: builder.mutation({
      query: (fileKey) => ({ url: driver().url, method: 'DELETE', body: { fileKey } }),
    }),
  }),
});

export const { useUploadFileMutation, useDeleteFileMutation } = uploadsApi;

// ----------------------------------------------------------------------
// Client-side helpers - no HTTP, just what the UI does with a stored file
// ----------------------------------------------------------------------

export function assertPdf(file) {
  if (!file) throw new Error('Choose a PDF to upload');

  if (file.type && file.type !== ACCEPTED_MIME) throw new Error('Only PDF files are accepted');

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`This PDF is larger than ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`);
  }
}

/** Records carry an absolute `fileUrl`; a bare key falls back to the API. */
export function fileUrlOf(doc) {
  const url = doc?.fileUrl ?? doc?.file;

  if (!url) return null;

  if (/^https?:\/\//i.test(url)) return url;

  return `${CONFIG.api.baseUrl}/${API_ROUTES.UPLOADS.FILE_BY_NAME(String(url).replace(/^\/+/, ''))}`;
}

export function openFile(doc) {
  const url = fileUrlOf(doc);

  if (!url) throw new Error('This PDF has no file attached');

  window.open(url, '_blank', 'noopener,noreferrer');
}

export function downloadFile(doc) {
  const url = fileUrlOf(doc);

  if (!url) throw new Error('This PDF has no file attached');

  const link = document.createElement('a');

  link.href = url;
  link.rel = 'noopener';
  link.target = '_blank';
  link.download = doc.name ? `${doc.name}.pdf` : '';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function formatFileSize(bytes) {
  if (!bytes) return null;

  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
