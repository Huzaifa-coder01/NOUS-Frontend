/**
 * NOUS mock backend.
 *
 * Everything the UI needs (auth + catalog + documents + users + settings) is
 * served from here, persisted in localStorage and returned through promises so
 * the calling code is already written the way it will be against a real API.
 *
 * PDF bytes are too big for localStorage, so they live in IndexedDB
 * (`file-store.js`) and the catalog only keeps a `fileId`.
 *
 * The rules the catalog enforces, in one place:
 *
 *  - every node carries `status` ('active' | 'inactive') and `deleted`;
 *  - deactivating a node deactivates every descendant node and document;
 *  - deleting a node soft deletes only that node and deactivates - never
 *    deletes - its descendants, so nothing is lost from the database;
 *  - document names are unique across the whole system.
 */

import {
  STATUS,
  nousSlug,
  DOC_KINDS,
  NOUS_SEED_USERS,
  NOUS_SEED_COURSES,
  NOUS_SEED_SETTINGS,
} from 'src/_mock/_nous';

import { createPdfBlob } from './pdf-stub';
import { signToken, verifyToken, hashPassword } from './mock-jwt';
import { fileStore, nextFileId, ACCEPTED_MIME, MAX_FILE_SIZE } from './file-store';

// ----------------------------------------------------------------------

const DB_KEY = 'nous.db';

const DB_VERSION = 2;

const LATENCY = 180;

// ----------------------------------------------------------------------

function delay(value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), LATENCY);
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));

  return db;
}

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function fail(message, status = 400) {
  throw new ApiError(message, status);
}

// ----------------------------------------------------------------------
// Catalog shape
// ----------------------------------------------------------------------

/** Node types, outermost first. */
export const NODE_TYPES = ['course', 'level', 'subject', 'chapter'];

const ID_KEY = {
  course: 'courseId',
  level: 'levelId',
  subject: 'subjectId',
  chapter: 'chapterId',
};

const CHILD_KEY = { course: 'levels', level: 'subjects', subject: 'chapters', chapter: null };

const CHILD_TYPE = { course: 'level', level: 'subject', subject: 'chapter', chapter: null };

export const NODE_LABEL = {
  course: 'Course',
  level: 'Level',
  subject: 'Subject',
  chapter: 'Chapter',
};

/** Document arrays carried by each node type. */
const DOC_KEYS = {
  course: [],
  level: [],
  subject: ['pastPapers'],
  chapter: ['pastPapers', 'syllabus', 'notes'],
};

function childrenOf(node, type) {
  const key = CHILD_KEY[type];

  return key ? node[key] ?? [] : [];
}

function docsOf(node, type) {
  return DOC_KEYS[type].flatMap((key) => node[key] ?? []);
}

// ----------------------------------------------------------------------
// Seeding
// ----------------------------------------------------------------------

let seeding = null;

/** Turns every `seedFile` marker in the seed catalog into a real PDF. */
async function materializeSeedFiles(courses) {
  const entries = [];

  courses.forEach((course) =>
    course.levels.forEach((level) =>
      level.subjects.forEach((subject) =>
        [subject, ...subject.chapters].forEach((node) => {
          const type = node === subject ? 'subject' : 'chapter';

          DOC_KEYS[type].forEach((key) =>
            (node[key] ?? []).forEach((doc) => {
              if (!doc.seedFile) return;

              const blob = createPdfBlob(doc.seedFile.title, doc.seedFile.body);
              const fileId = nextFileId();

              entries.push({ id: fileId, blob, name: doc.fileName, mimeType: ACCEPTED_MIME });

              doc.fileId = fileId;
              doc.fileSize = blob.size;
              delete doc.seedFile;
            })
          );
        })
      )
    )
  );

  if (entries.length) {
    await fileStore.putMany(entries);
  }

  return courses;
}

async function seed() {
  const users = await Promise.all(
    NOUS_SEED_USERS.map(async ({ password, ...user }) => ({
      ...user,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    }))
  );

  const courses = await materializeSeedFiles(clone(NOUS_SEED_COURSES));

  return writeDb({
    version: DB_VERSION,
    courses,
    users,
    settings: { ...NOUS_SEED_SETTINGS },
  });
}

async function db() {
  const existing = readDb();

  if (existing?.version === DB_VERSION) {
    return existing;
  }

  if (!seeding) {
    seeding = seed().finally(() => {
      seeding = null;
    });
  }

  return seeding;
}

/** Wipes the local database (metadata + PDFs) and re-seeds it. */
export async function resetDatabase() {
  localStorage.removeItem(DB_KEY);

  await fileStore.clear();

  await seed();

  return delay(true);
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function uniqueId(collection, name, fallback) {
  const base = nousSlug(name) || fallback;

  let id = base;
  let suffix = 2;

  while (collection.some((item) => item.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  return id;
}

/**
 * Walks the url segments down the tree. Returns every node it passed through so
 * callers can read the ancestor chain as well as the target.
 */
function locate(data, path = {}) {
  const found = {};

  let list = data.courses;

  for (const type of NODE_TYPES) {
    const id = path[ID_KEY[type]];

    if (!id) break;

    const node = list.find((item) => item.id === id);

    if (!node) fail(`${NODE_LABEL[type]} "${id}" not found`, 404);

    found[type] = node;

    list = childrenOf(node, type);
  }

  return found;
}

/** The array a node of `type` lives in, given its parent path. */
function collectionFor(data, type, path) {
  if (type === 'course') return data.courses;

  const parentType = NODE_TYPES[NODE_TYPES.indexOf(type) - 1];

  const found = locate(data, path);

  const parent = found[parentType];

  if (!parent) fail(`${NODE_LABEL[parentType]} not found`, 404);

  return parent[CHILD_KEY[parentType]];
}

function nodeFor(data, type, path) {
  const found = locate(data, path);

  const node = found[type];

  if (!node) fail(`${NODE_LABEL[type]} not found`, 404);

  return node;
}

/** True when the node and its whole ancestor chain are active and not deleted. */
function isVisible(chain) {
  return chain.every((node) => node && node.status === STATUS.active && !node.deleted);
}

function move(list, id, direction) {
  const index = list.findIndex((item) => item.id === id);

  if (index < 0) fail('Item not found', 404);

  const target = index + direction;

  if (target < 0 || target >= list.length) return list;

  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);

  return list;
}

// ----------------------------------------------------------------------
// Cascade
// ----------------------------------------------------------------------

/** Deactivates every descendant node and document of `node`. */
function deactivateDescendants(node, type) {
  docsOf(node, type).forEach((doc) => {
    doc.status = STATUS.inactive;
  });

  const childType = CHILD_TYPE[type];

  if (!childType) return;

  childrenOf(node, type).forEach((child) => {
    child.status = STATUS.inactive;
    deactivateDescendants(child, childType);
  });
}

// ----------------------------------------------------------------------
// Auth
// ----------------------------------------------------------------------

export const authApi = {
  async signIn({ email, password }) {
    const data = await db();

    const user = data.users.find(
      (item) => item.email.toLowerCase() === String(email).trim().toLowerCase()
    );

    if (!user) fail('No account found for this email', 401);

    if (user.status !== 'active') fail('This account has been disabled', 403);

    const passwordHash = await hashPassword(password);

    if (passwordHash !== user.passwordHash) fail('Incorrect password', 401);

    const accessToken = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return delay({ accessToken, user: publicUser(user) });
  },

  async signUp({ name, email, password }) {
    const data = await db();

    const normalized = String(email).trim().toLowerCase();

    if (data.users.some((item) => item.email.toLowerCase() === normalized)) {
      fail('An account with this email already exists', 409);
    }

    const user = {
      id: uniqueId(data.users, name, 'user'),
      name: String(name).trim(),
      email: normalized,
      passwordHash: await hashPassword(password),
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    data.users.push(user);
    writeDb(data);

    const accessToken = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return delay({ accessToken, user: publicUser(user) });
  },

  /**
   * Password reset, mock style: there is no mailer, so the one-time code is
   * returned to the caller and shown on screen. A real backend would email it
   * and return nothing.
   */
  async requestPasswordReset({ email }) {
    const data = await db();

    const normalized = String(email).trim().toLowerCase();

    const user = data.users.find((item) => item.email.toLowerCase() === normalized);

    if (!user) fail('No account found for this email', 404);

    const code = String(Math.floor(100000 + Math.random() * 900000));

    data.passwordResets = {
      ...(data.passwordResets ?? {}),
      [normalized]: { code, expiresAt: Date.now() + 10 * 60 * 1000 },
    };

    writeDb(data);

    return delay({ email: normalized, code });
  },

  async verifyResetCode({ email, code }) {
    const data = await db();

    assertResetCode(data, String(email).trim().toLowerCase(), code);

    return delay(true);
  },

  async resetPassword({ email, code, password }) {
    const data = await db();

    const normalized = String(email).trim().toLowerCase();

    assertResetCode(data, normalized, code);

    const user = data.users.find((item) => item.email.toLowerCase() === normalized);

    if (!user) fail('No account found for this email', 404);

    user.passwordHash = await hashPassword(password);

    delete data.passwordResets[normalized];

    writeDb(data);

    return delay(true);
  },

  /** Verifies the signature + expiry, then returns the current user record. */
  async me(accessToken) {
    const payload = await verifyToken(accessToken);

    if (!payload) fail('Session expired', 401);

    const data = await db();

    const user = data.users.find((item) => item.id === payload.sub);

    if (!user) fail('Account no longer exists', 401);

    if (user.status !== 'active') fail('This account has been disabled', 403);

    return { user: publicUser(user) };
  },
};

function assertResetCode(data, email, code) {
  const pending = data.passwordResets?.[email];

  if (!pending) fail('Request a new reset code', 400);
  if (pending.expiresAt < Date.now()) fail('This code has expired', 400);
  if (pending.code !== String(code).trim()) fail('Incorrect code', 400);
}

function publicUser(user) {
  const { passwordHash, ...rest } = user;

  return rest;
}

/** True when `id` is the only admin who can still reach the admin panel. */
function isLastActiveAdmin(data, id) {
  const user = data.users.find((item) => item.id === id);

  if (user?.role !== 'admin' || user?.status !== 'active') return false;

  return !data.users.some(
    (item) => item.id !== id && item.role === 'admin' && item.status === 'active'
  );
}

// ----------------------------------------------------------------------
// Users (admin)
// ----------------------------------------------------------------------

export const usersApi = {
  async list() {
    const data = await db();

    return delay(data.users.map(publicUser));
  },

  async create({ name, email, password, role = 'user', status = 'active' }) {
    const data = await db();

    const normalized = String(email).trim().toLowerCase();

    if (data.users.some((item) => item.email.toLowerCase() === normalized)) {
      fail('An account with this email already exists', 409);
    }

    const user = {
      id: uniqueId(data.users, name, 'user'),
      name: String(name).trim(),
      email: normalized,
      passwordHash: await hashPassword(password),
      role,
      status,
      createdAt: new Date().toISOString(),
    };

    data.users.push(user);
    writeDb(data);

    return delay(publicUser(user));
  },

  async update(id, { name, email, role, status, password }) {
    const data = await db();

    const user = data.users.find((item) => item.id === id);

    if (!user) fail('User not found', 404);

    if (email) {
      const normalized = String(email).trim().toLowerCase();

      if (data.users.some((item) => item.id !== id && item.email.toLowerCase() === normalized)) {
        fail('An account with this email already exists', 409);
      }

      user.email = normalized;
    }

    // never let the last usable admin demote or disable themselves out of the panel
    const losingAdminAccess = (role && role !== 'admin') || (status && status !== 'active');

    if (losingAdminAccess && isLastActiveAdmin(data, id)) {
      fail('This is the last active admin - promote another admin first', 409);
    }

    if (name) user.name = String(name).trim();
    if (role) user.role = role;
    if (status) user.status = status;
    if (password) user.passwordHash = await hashPassword(password);

    writeDb(data);

    return delay(publicUser(user));
  },

  async remove(id) {
    const data = await db();

    const user = data.users.find((item) => item.id === id);

    if (!user) fail('User not found', 404);

    if (isLastActiveAdmin(data, id)) {
      fail('Cannot delete the last active admin', 409);
    }

    data.users = data.users.filter((item) => item.id !== id);
    writeDb(data);

    return delay(true);
  },
};

// ----------------------------------------------------------------------
// Catalog: course > level > subject > chapter
// ----------------------------------------------------------------------

/**
 * Url segments the router hands to a fixed page rather than to a record, so a
 * node may never slug down to one of them.
 */
const RESERVED_IDS = { subject: ['past-papers'], chapter: ['past-papers', 'syllabus', 'notes'] };

function assertUsableName(type, name) {
  const reserved = RESERVED_IDS[type] ?? [];

  if (reserved.includes(nousSlug(name))) {
    fail(`"${name}" is a reserved name - please choose another`, 409);
  }
}

function newNode(type, collection, values) {
  const name = String(values.name ?? '').trim();

  if (!name) fail(`${NODE_LABEL[type]} name is required`, 400);

  assertUsableName(type, name);

  if (collection.some((item) => item.name.toLowerCase() === name.toLowerCase() && !item.deleted)) {
    fail(`A ${type} called "${name}" already exists here`, 409);
  }

  const base = {
    id: uniqueId(collection, name, type),
    name,
    status: values.status === STATUS.inactive ? STATUS.inactive : STATUS.active,
    deleted: false,
  };

  if (type === 'course') {
    return {
      ...base,
      icon: values.icon || '\u{1F4DA}',
      description: String(values.description ?? '').trim(),
      levels: [],
    };
  }

  if (type === 'level') {
    return { ...base, subjects: [] };
  }

  if (type === 'subject') {
    const total = Math.min(Math.max(Number(values.chapters) || 0, 0), 100);

    return {
      ...base,
      pastPapers: [],
      chapters: Array.from({ length: total }, (_, index) => ({
        id: `chapter-${index + 1}`,
        name: `Chapter ${index + 1}`,
        title: `${name} - Chapter ${index + 1}`,
        status: STATUS.active,
        deleted: false,
        pastPapers: [],
        syllabus: [],
        notes: [],
      })),
    };
  }

  return {
    ...base,
    title: String(values.title || name).trim(),
    pastPapers: [],
    syllabus: [],
    notes: [],
  };
}

const EDITABLE = {
  course: ['name', 'icon', 'description'],
  level: ['name'],
  subject: ['name'],
  chapter: ['name', 'title'],
};

export const catalogApi = {
  async get() {
    const data = await db();

    return delay(clone(data.courses));
  },

  async getSettings() {
    const data = await db();

    return delay({ ...data.settings });
  },

  async updateSettings(values) {
    const data = await db();

    data.settings = { ...data.settings, ...values };
    writeDb(data);

    return delay({ ...data.settings });
  },

  /** `path` is the PARENT path, e.g. create('subject', { courseId, levelId }). */
  async create(type, path, values) {
    const data = await db();

    const collection = collectionFor(data, type, { ...path, [ID_KEY[type]]: undefined });

    const node = newNode(type, collection, values);

    collection.push(node);
    writeDb(data);

    return delay(clone(node));
  },

  /** `path` includes the node's own id from here on. */
  async update(type, path, values) {
    const data = await db();

    const node = nodeFor(data, type, path);

    if (values.name !== undefined) {
      const name = String(values.name).trim();

      if (!name) fail(`${NODE_LABEL[type]} name is required`, 400);

      const siblings = collectionFor(data, type, path);

      if (
        siblings.some(
          (item) =>
            item.id !== node.id && !item.deleted && item.name.toLowerCase() === name.toLowerCase()
        )
      ) {
        fail(`A ${type} called "${name}" already exists here`, 409);
      }
    }

    EDITABLE[type].forEach((key) => {
      if (values[key] !== undefined) node[key] = String(values[key]).trim();
    });

    writeDb(data);

    return delay(clone(node));
  },

  /**
   * Activate / deactivate. Deactivating cascades down; activating only touches
   * the node itself, so a parent coming back online does not silently republish
   * children that were switched off on purpose.
   */
  async setStatus(type, path, status) {
    const data = await db();

    const node = nodeFor(data, type, path);

    if (node.deleted) fail(`This ${type} has been deleted`, 409);

    if (![STATUS.active, STATUS.inactive].includes(status)) fail('Unknown status', 400);

    node.status = status;

    if (status === STATUS.inactive) {
      deactivateDescendants(node, type);
    }

    writeDb(data);

    return delay(clone(node));
  },

  /**
   * Soft delete. The node is flagged deleted and everything under it is
   * deactivated but kept, so no child record is ever lost.
   */
  async remove(type, path) {
    const data = await db();

    const node = nodeFor(data, type, path);

    node.deleted = true;
    node.status = STATUS.inactive;
    node.deletedAt = new Date().toISOString();

    deactivateDescendants(node, type);

    writeDb(data);

    return delay(true);
  },

  async restore(type, path) {
    const data = await db();

    const node = nodeFor(data, type, path);

    node.deleted = false;
    delete node.deletedAt;

    writeDb(data);

    return delay(clone(node));
  },

  async move(type, path, direction) {
    const data = await db();

    const collection = collectionFor(data, type, path);

    move(collection, path[ID_KEY[type]], direction);
    writeDb(data);

    return delay(clone(collection));
  },
};

// ----------------------------------------------------------------------
// Documents (PDFs): past papers, syllabus, notes
// ----------------------------------------------------------------------

/** Every document in the database, with the node chain that owns it. */
function walkDocs(data, visit) {
  data.courses.forEach((course) =>
    course.levels.forEach((level) =>
      level.subjects.forEach((subject) => {
        DOC_KEYS.subject.forEach((key) =>
          (subject[key] ?? []).forEach((doc) =>
            visit(doc, { course, level, subject, chapter: null }, key)
          )
        );

        subject.chapters.forEach((chapter) =>
          DOC_KEYS.chapter.forEach((key) =>
            (chapter[key] ?? []).forEach((doc) =>
              visit(doc, { course, level, subject, chapter }, key)
            )
          )
        );
      })
    )
  );
}

/** Document names are unique across the whole system, not just per chapter. */
function assertUniqueDocName(data, name, currentDoc) {
  const needle = String(name).trim().toLowerCase();

  if (!needle) fail('A PDF name is required', 400);

  let clash = null;

  walkDocs(data, (doc, chain) => {
    if (doc === currentDoc || clash) return;

    if (doc.name.trim().toLowerCase() === needle) clash = { doc, chain };
  });

  if (clash) {
    const { chain } = clash;

    const where = [chain.course.name, chain.level.name, chain.subject.name, chain.chapter?.name]
      .filter(Boolean)
      .join(' / ');

    fail(`A PDF named "${String(name).trim()}" already exists in ${where}`, 409);
  }
}

/** The array a document of `kind` lives in, at `path`. */
function docCollection(data, kind, path) {
  const key = DOC_KINDS[kind];

  if (!key) fail(`Unknown document kind "${kind}"`, 400);

  const found = locate(data, path);

  const node = path.chapterId ? found.chapter : found.subject;

  if (!node) fail('Subject or chapter not found', 404);

  if (!path.chapterId && kind !== 'past-paper') {
    fail(`${kind} documents belong to a chapter`, 400);
  }

  node[key] = node[key] ?? [];

  return node[key];
}

async function storeUpload(file, name) {
  if (!file) return null;

  if (file.type && file.type !== ACCEPTED_MIME) fail('Only PDF files are accepted', 415);

  if (file.size > MAX_FILE_SIZE) {
    fail(`This PDF is larger than ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`, 413);
  }

  return fileStore.put(file, { name: `${nousSlug(name)}.pdf`, mimeType: ACCEPTED_MIME });
}

export const docsApi = {
  /**
   * `path` is `{ courseId, levelId, subjectId, chapterId? }`. A past paper may
   * sit on a subject (no chapterId) or on a chapter; syllabus and notes are
   * always on a chapter.
   */
  async create(kind, path, { name, file, status, uploadedBy, ...rest }) {
    const data = await db();

    const collection = docCollection(data, kind, path);

    const trimmed = String(name ?? '').trim();

    assertUniqueDocName(data, trimmed, null);

    if (!file) fail('Choose a PDF to upload', 400);

    const stored = await storeUpload(file, trimmed);

    const doc = {
      id: uniqueId(collection, trimmed, kind),
      name: trimmed,
      kind,
      status: status === STATUS.inactive ? STATUS.inactive : STATUS.active,
      deleted: false,
      fileId: stored.fileId,
      fileName: stored.fileName,
      originalFileName: file.name,
      fileSize: stored.fileSize,
      mimeType: stored.mimeType,
      uploadedBy: uploadedBy ?? { id: 'user-admin', name: 'NOUS Admin', role: 'admin' },
      createdAt: new Date().toISOString(),
    };

    if (kind === 'past-paper') {
      doc.year = Number(rest.year) || new Date().getFullYear();
      doc.session = rest.session ?? '';
      doc.type = rest.type ?? '';
    }

    collection.push(doc);
    writeDb(data);

    return delay(clone(doc));
  },

  async update(kind, path, docId, { name, file, ...rest }) {
    const data = await db();

    const collection = docCollection(data, kind, path);

    const doc = collection.find((item) => item.id === docId);

    if (!doc) fail('PDF not found', 404);

    if (name !== undefined) {
      const trimmed = String(name).trim();

      assertUniqueDocName(data, trimmed, doc);

      doc.name = trimmed;
      doc.fileName = `${nousSlug(trimmed)}.pdf`;
    }

    if (file) {
      const stored = await storeUpload(file, doc.name);

      await fileStore.remove(doc.fileId);

      doc.fileId = stored.fileId;
      doc.fileName = stored.fileName;
      doc.originalFileName = file.name;
      doc.fileSize = stored.fileSize;
      doc.mimeType = stored.mimeType;
      doc.updatedAt = new Date().toISOString();
    }

    if (kind === 'past-paper') {
      if (rest.year !== undefined) doc.year = Number(rest.year) || doc.year;
      if (rest.session !== undefined) doc.session = rest.session;
      if (rest.type !== undefined) doc.type = rest.type;
    }

    writeDb(data);

    return delay(clone(doc));
  },

  async setStatus(kind, path, docId, status) {
    const data = await db();

    const collection = docCollection(data, kind, path);

    const doc = collection.find((item) => item.id === docId);

    if (!doc) fail('PDF not found', 404);

    if (![STATUS.active, STATUS.inactive].includes(status)) fail('Unknown status', 400);

    doc.status = status;
    writeDb(data);

    return delay(clone(doc));
  },

  /** Documents have no children, so a delete really removes them. */
  async remove(kind, path, docId) {
    const data = await db();

    const collection = docCollection(data, kind, path);

    const doc = collection.find((item) => item.id === docId);

    if (!doc) fail('PDF not found', 404);

    await fileStore.remove(doc.fileId);

    const index = collection.indexOf(doc);

    collection.splice(index, 1);
    writeDb(data);

    return delay(true);
  },

  /**
   * Flat list for the admin modules: every document of `kind`, wherever it
   * lives, with its course / level / subject / chapter context attached.
   */
  async listAll(kind) {
    const data = await db();

    const rows = [];

    walkDocs(data, (doc, chain) => {
      if (kind && doc.kind !== kind) return;

      const scope = chain.chapter ? 'chapter' : 'subject';

      const path = {
        courseId: chain.course.id,
        levelId: chain.level.id,
        subjectId: chain.subject.id,
        ...(chain.chapter ? { chapterId: chain.chapter.id } : {}),
      };

      const ancestors = [chain.course, chain.level, chain.subject, chain.chapter].filter(Boolean);

      rows.push({
        ...clone(doc),
        rowId: [...Object.values(path), doc.id].join('/'),
        path,
        scope,
        courseName: chain.course.name,
        levelName: chain.level.name,
        subjectName: chain.subject.name,
        chapterName: chain.chapter?.name ?? null,
        // active in its own right, but hidden if any ancestor is switched off
        effectiveStatus:
          doc.status === STATUS.active && isVisible(ancestors) ? STATUS.active : STATUS.inactive,
        hiddenByParent: doc.status === STATUS.active && !isVisible(ancestors),
      });
    });

    return delay(rows);
  },
};

// ----------------------------------------------------------------------
// Notes (student uploads)
// ----------------------------------------------------------------------

export const notesApi = {
  /**
   * The one write a student is allowed. The upload lands on the chapter, is
   * active straight away and is therefore visible to every student - not just
   * whoever uploaded it.
   */
  async upload(path, { name, file }, user) {
    if (!path?.chapterId) fail('Notes belong to a chapter', 400);

    return docsApi.create('note', path, {
      name,
      file,
      status: STATUS.active,
      uploadedBy: user ? { id: user.id, name: user.name, role: user.role } : undefined,
    });
  },
};
