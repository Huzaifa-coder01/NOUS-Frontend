/**
 * NOUS mock backend.
 *
 * Everything the UI needs (auth + catalog + users + settings) is served from
 * here, persisted in localStorage and returned through promises so the calling
 * code is already written the way it will be against a real API. Replacing this
 * file with axios calls is the only change needed once the server exists.
 */

import {
  nousSlug,
  NOUS_SEED_USERS,
  DEFAULT_RESOURCES,
  NOUS_SEED_PROGRAMS,
  NOUS_SEED_SETTINGS,
  createSeedResources,
} from 'src/_mock/_nous';

import { signToken, verifyToken, hashPassword } from './mock-jwt';

// ----------------------------------------------------------------------

const DB_KEY = 'nous.db';

const DB_VERSION = 1;

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

let seeding = null;

async function seed() {
  const users = await Promise.all(
    NOUS_SEED_USERS.map(async ({ password, ...user }) => ({
      ...user,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    }))
  );

  return writeDb({
    version: DB_VERSION,
    programs: clone(NOUS_SEED_PROGRAMS),
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

/** Wipes the local database and re-seeds it from `src/_mock/_nous.js`. */
export async function resetDatabase() {
  localStorage.removeItem(DB_KEY);

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

function locate(data, { programId, levelId, subjectId, chapterId }) {
  const program = data.programs.find((item) => item.id === programId);

  if (programId && !program) fail(`Program "${programId}" not found`, 404);
  if (!levelId) return { program };

  const level = program.levels.find((item) => item.id === levelId);

  if (!level) fail(`Level "${levelId}" not found`, 404);
  if (!subjectId) return { program, level };

  const subject = level.subjects.find((item) => item.id === subjectId);

  if (!subject) fail(`Subject "${subjectId}" not found`, 404);
  if (!chapterId) return { program, level, subject };

  const chapter = subject.chapters.find((item) => item.id === chapterId);

  if (!chapter) fail(`Chapter "${chapterId}" not found`, 404);

  return { program, level, subject, chapter };
}

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
    const losingAdminAccess =
      (role && role !== 'admin') || (status && status !== 'active');

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
// Catalog: programs > levels > subjects > chapters > resources
// ----------------------------------------------------------------------

export const catalogApi = {
  async get() {
    const data = await db();

    return delay(clone(data.programs));
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

  // Programs ----------------------------------------------------------

  async createProgram({ name, icon = '📚', description = '' }) {
    const data = await db();

    const program = {
      id: uniqueId(data.programs, name, 'program'),
      name: String(name).trim(),
      icon,
      description,
      levels: [],
    };

    data.programs.push(program);
    writeDb(data);

    return delay(clone(program));
  },

  async updateProgram(programId, values) {
    const data = await db();
    const { program } = locate(data, { programId });

    Object.assign(program, values);
    writeDb(data);

    return delay(clone(program));
  },

  async deleteProgram(programId) {
    const data = await db();

    locate(data, { programId });

    data.programs = data.programs.filter((item) => item.id !== programId);
    writeDb(data);

    return delay(true);
  },

  async moveProgram(programId, direction) {
    const data = await db();

    move(data.programs, programId, direction);
    writeDb(data);

    return delay(clone(data.programs));
  },

  // Levels ------------------------------------------------------------

  async createLevel(programId, { name }) {
    const data = await db();
    const { program } = locate(data, { programId });

    const level = {
      id: uniqueId(program.levels, name, 'level'),
      name: String(name).trim(),
      subjects: [],
    };

    program.levels.push(level);
    writeDb(data);

    return delay(clone(level));
  },

  async updateLevel(programId, levelId, values) {
    const data = await db();
    const { level } = locate(data, { programId, levelId });

    Object.assign(level, values);
    writeDb(data);

    return delay(clone(level));
  },

  async deleteLevel(programId, levelId) {
    const data = await db();
    const { program } = locate(data, { programId, levelId });

    program.levels = program.levels.filter((item) => item.id !== levelId);
    writeDb(data);

    return delay(true);
  },

  async moveLevel(programId, levelId, direction) {
    const data = await db();
    const { program } = locate(data, { programId });

    move(program.levels, levelId, direction);
    writeDb(data);

    return delay(clone(program.levels));
  },

  // Subjects ----------------------------------------------------------

  async createSubject(programId, levelId, { name, chapters = 0 }) {
    const data = await db();
    const { level } = locate(data, { programId, levelId });

    const subjectName = String(name).trim();

    const subject = {
      id: uniqueId(level.subjects, subjectName, 'subject'),
      name: subjectName,
      pastPapers: [],
      chapters: Array.from({ length: Number(chapters) || 0 }, (_, index) => ({
        id: `chapter-${index + 1}`,
        name: `Chapter ${index + 1}`,
        title: `${subjectName} - Chapter ${index + 1}`,
        resources: createSeedResources(),
        pastPapers: [],
      })),
    };

    level.subjects.push(subject);
    writeDb(data);

    return delay(clone(subject));
  },

  async updateSubject(programId, levelId, subjectId, values) {
    const data = await db();
    const { subject } = locate(data, { programId, levelId, subjectId });

    Object.assign(subject, values);
    writeDb(data);

    return delay(clone(subject));
  },

  async deleteSubject(programId, levelId, subjectId) {
    const data = await db();
    const { level } = locate(data, { programId, levelId, subjectId });

    level.subjects = level.subjects.filter((item) => item.id !== subjectId);
    writeDb(data);

    return delay(true);
  },

  async moveSubject(programId, levelId, subjectId, direction) {
    const data = await db();
    const { level } = locate(data, { programId, levelId });

    move(level.subjects, subjectId, direction);
    writeDb(data);

    return delay(clone(level.subjects));
  },

  // Chapters ----------------------------------------------------------

  async createChapter(programId, levelId, subjectId, { name, title }) {
    const data = await db();
    const { subject } = locate(data, { programId, levelId, subjectId });

    const chapterName = String(name).trim();

    const chapter = {
      id: uniqueId(subject.chapters, chapterName, 'chapter'),
      name: chapterName,
      title: String(title || `${subject.name} - ${chapterName}`).trim(),
      resources: createSeedResources(),
      pastPapers: [],
    };

    subject.chapters.push(chapter);
    writeDb(data);

    return delay(clone(chapter));
  },

  async updateChapter(programId, levelId, subjectId, chapterId, values) {
    const data = await db();
    const { chapter } = locate(data, { programId, levelId, subjectId, chapterId });

    Object.assign(chapter, values);
    writeDb(data);

    return delay(clone(chapter));
  },

  async deleteChapter(programId, levelId, subjectId, chapterId) {
    const data = await db();
    const { subject } = locate(data, { programId, levelId, subjectId, chapterId });

    subject.chapters = subject.chapters.filter((item) => item.id !== chapterId);
    writeDb(data);

    return delay(true);
  },

  async moveChapter(programId, levelId, subjectId, chapterId, direction) {
    const data = await db();
    const { subject } = locate(data, { programId, levelId, subjectId });

    move(subject.chapters, chapterId, direction);
    writeDb(data);

    return delay(clone(subject.chapters));
  },

  // Past papers: subject level (whole exam papers) --------------------

  async createSubjectPaper(programId, levelId, subjectId, values) {
    const data = await db();
    const { subject } = locate(data, { programId, levelId, subjectId });

    subject.pastPapers = subject.pastPapers ?? [];

    const paper = {
      id: uniqueId(subject.pastPapers, `${values.year} ${values.session} ${values.type}`, 'paper'),
      title: String(values.title).trim(),
      year: Number(values.year),
      session: values.session,
      type: values.type,
      durationMins: Number(values.durationMins) || 0,
      totalMarks: Number(values.totalMarks) || 0,
      fileUrl: values.fileUrl ?? '',
      status: values.status ?? 'published',
    };

    subject.pastPapers.push(paper);
    writeDb(data);

    return delay(clone(paper));
  },

  async updateSubjectPaper(programId, levelId, subjectId, paperId, values) {
    const data = await db();
    const { subject } = locate(data, { programId, levelId, subjectId });

    const paper = subject.pastPapers?.find((item) => item.id === paperId);

    if (!paper) fail('Past paper not found', 404);

    Object.assign(paper, values, {
      year: values.year !== undefined ? Number(values.year) : paper.year,
      durationMins:
        values.durationMins !== undefined ? Number(values.durationMins) : paper.durationMins,
      totalMarks: values.totalMarks !== undefined ? Number(values.totalMarks) : paper.totalMarks,
    });

    writeDb(data);

    return delay(clone(paper));
  },

  async deleteSubjectPaper(programId, levelId, subjectId, paperId) {
    const data = await db();
    const { subject } = locate(data, { programId, levelId, subjectId });

    subject.pastPapers = (subject.pastPapers ?? []).filter((item) => item.id !== paperId);
    writeDb(data);

    return delay(true);
  },

  // Past papers: chapter level (individual past questions) -------------

  async createChapterPaper(programId, levelId, subjectId, chapterId, values) {
    const data = await db();
    const { chapter } = locate(data, { programId, levelId, subjectId, chapterId });

    chapter.pastPapers = chapter.pastPapers ?? [];

    const paper = {
      id: uniqueId(
        chapter.pastPapers,
        `${values.year} ${values.session} ${values.questionNo} ${values.type}`,
        'question'
      ),
      title: String(values.title).trim(),
      year: Number(values.year),
      session: values.session,
      type: values.type,
      marks: Number(values.marks) || 0,
      questionNo: values.questionNo ?? '',
      content: values.content ?? '',
      status: values.status ?? 'published',
    };

    chapter.pastPapers.push(paper);
    writeDb(data);

    return delay(clone(paper));
  },

  async updateChapterPaper(programId, levelId, subjectId, chapterId, paperId, values) {
    const data = await db();
    const { chapter } = locate(data, { programId, levelId, subjectId, chapterId });

    const paper = chapter.pastPapers?.find((item) => item.id === paperId);

    if (!paper) fail('Past paper not found', 404);

    Object.assign(paper, values, {
      year: values.year !== undefined ? Number(values.year) : paper.year,
      marks: values.marks !== undefined ? Number(values.marks) : paper.marks,
    });

    writeDb(data);

    return delay(clone(paper));
  },

  async deleteChapterPaper(programId, levelId, subjectId, chapterId, paperId) {
    const data = await db();
    const { chapter } = locate(data, { programId, levelId, subjectId, chapterId });

    chapter.pastPapers = (chapter.pastPapers ?? []).filter((item) => item.id !== paperId);
    writeDb(data);

    return delay(true);
  },

  // Resources ---------------------------------------------------------

  async createResource(programId, levelId, subjectId, chapterId, values) {
    const data = await db();
    const { chapter } = locate(data, { programId, levelId, subjectId, chapterId });

    chapter.resources = chapter.resources ?? [];

    const resource = {
      id: uniqueId(chapter.resources, values.name, 'resource'),
      name: String(values.name).trim(),
      icon: values.icon || DEFAULT_RESOURCES[0].icon,
      description: values.description || '',
      content: values.content || '',
    };

    chapter.resources.push(resource);
    writeDb(data);

    return delay(clone(resource));
  },

  async updateResource(programId, levelId, subjectId, chapterId, resourceId, values) {
    const data = await db();
    const { chapter } = locate(data, { programId, levelId, subjectId, chapterId });

    const resource = chapter.resources?.find((item) => item.id === resourceId);

    if (!resource) fail('Resource not found', 404);

    Object.assign(resource, values);
    writeDb(data);

    return delay(clone(resource));
  },

  async deleteResource(programId, levelId, subjectId, chapterId, resourceId) {
    const data = await db();
    const { chapter } = locate(data, { programId, levelId, subjectId, chapterId });

    chapter.resources = (chapter.resources ?? []).filter((item) => item.id !== resourceId);
    writeDb(data);

    return delay(true);
  },
};
