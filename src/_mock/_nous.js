// ----------------------------------------------------------------------
// NOUS - seed data for the mock backend (src/lib/mock-server.js).
//
// The hierarchy is course > level > subject > chapter. Past papers hang off a
// subject and off a chapter; syllabus and notes hang off a chapter only.
//
// Every node carries `status` ('active' | 'inactive') and `deleted`. Students
// only ever see nodes whose whole ancestor chain is active and not deleted.
// ----------------------------------------------------------------------

export const CHAPTERS_PER_SUBJECT = 10;

/** Chapters that get demo PDFs - enough to show the flow without a huge seed. */
const SEEDED_CHAPTERS = 3;

export function nousSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ----------------------------------------------------------------------
// Status
// ----------------------------------------------------------------------

export const STATUS = { active: 'active', inactive: 'inactive' };

export const STATUS_OPTIONS = [
  { value: STATUS.active, label: 'Active' },
  { value: STATUS.inactive, label: 'Inactive' },
];

// ----------------------------------------------------------------------
// Documents (PDFs)
// ----------------------------------------------------------------------

/** Document kinds and the array each one lives in on its parent node. */
export const DOC_KINDS = {
  'past-paper': 'pastPapers',
  syllabus: 'syllabus',
  note: 'notes',
};

export const DOC_LABELS = {
  'past-paper': { singular: 'Past paper', plural: 'Past papers' },
  syllabus: { singular: 'Syllabus', plural: 'Syllabus' },
  note: { singular: 'Note', plural: 'Notes' },
};

/**
 * The three sections every chapter offers. `id` doubles as the url segment on
 * both the student site and the admin panel.
 */
export const CHAPTER_SECTIONS = [
  {
    id: 'syllabus',
    kind: 'syllabus',
    name: 'Syllabus',
    icon: '\u{1F4CB}',
    description: 'Syllabus PDFs for this chapter',
  },
  {
    id: 'notes',
    kind: 'note',
    name: 'Notes',
    icon: '\u{1F4DD}',
    description: 'Notes shared by students',
  },
  {
    id: 'past-papers',
    kind: 'past-paper',
    name: 'Past Papers',
    icon: '\u{1F4C4}',
    description: 'Past paper PDFs for this chapter',
  },
];

export function sectionByRouteId(routeId) {
  return CHAPTER_SECTIONS.find((section) => section.id === routeId);
}

export const COURSE_ICONS = [
  '\u{1F4DA}',
  '\u{1F393}',
  '\u{1F4D6}',
  '\u{1F4D8}',
  '\u{1F3DB}\u{FE0F}',
  '\u{1F9FE}',
  '\u{1F4BC}',
];

export const PAPER_SESSIONS = ['Spring', 'Summer', 'Autumn', 'Winter'];

export const PAPER_TYPES = ['Question paper', 'Suggested answers', 'Examiner report'];

// ----------------------------------------------------------------------

const SEED_CATALOG = [
  {
    name: 'CA',
    icon: '\u{1F4DA}',
    description: 'Explore PRC and CAF levels, subjects, chapters and study resources.',
    levels: {
      PRC: ['Business Mathematics', 'Introduction to Accounting', 'Business Economics'],
      'CAF 1': ['Accounting', 'Business Law', 'Economics', 'Quantitative Methods'],
      'CAF 2': ['Financial Accounting', 'Cost Accounting', 'Taxation', 'Business Finance'],
    },
  },
  {
    name: 'ACCA',
    icon: '\u{1F393}',
    description: 'Explore ACCA qualification levels, papers and study resources.',
    levels: {
      'Applied Knowledge': [
        'Business & Technology',
        'Management Accounting',
        'Financial Accounting',
      ],
      'Applied Skills': [
        'Corporate & Business Law',
        'Performance Management',
        'Taxation',
        'Financial Reporting',
        'Audit & Assurance',
        'Financial Management',
      ],
      'Strategic Professional': [
        'Strategic Business Leader',
        'Strategic Business Reporting',
        'Advanced Financial Management',
        'Advanced Performance Management',
        'Advanced Taxation',
        'Advanced Audit & Assurance',
      ],
    },
  },
];

// ----------------------------------------------------------------------

const YEAR = new Date().getFullYear() - 1;

const SEED_ADMIN = { id: 'user-admin', name: 'NOUS Admin', role: 'admin' };

const SEED_STUDENT = { id: 'user-student', name: 'Demo Student', role: 'user' };

/**
 * Seed documents carry `seedFile` instead of a `fileId`: the mock server turns
 * each one into a real PDF in IndexedDB the first time the app boots.
 */
function seedDoc({ id, name, kind, extra = {}, uploadedBy = SEED_ADMIN, body = [] }) {
  return {
    id,
    name,
    kind,
    status: STATUS.active,
    deleted: false,
    fileId: null,
    fileName: `${nousSlug(name)}.pdf`,
    fileSize: 0,
    mimeType: 'application/pdf',
    uploadedBy,
    createdAt: new Date().toISOString(),
    seedFile: { title: name, body },
    ...extra,
  };
}

/** Full exam papers, attached to the subject. */
function seedSubjectPapers(path, subjectName) {
  return [
    { session: 'Autumn', type: 'Question paper', year: YEAR },
    { session: 'Spring', type: 'Question paper', year: YEAR },
    { session: 'Spring', type: 'Suggested answers', year: YEAR },
    { session: 'Autumn', type: 'Question paper', year: YEAR - 1 },
  ].map((paper) =>
    seedDoc({
      id: nousSlug(`${paper.year}-${paper.session}-${paper.type}`),
      name: `${path} - ${paper.session} ${paper.year} ${paper.type}`,
      kind: 'past-paper',
      extra: { year: paper.year, session: paper.session, type: paper.type },
      body: [
        `Subject: ${subjectName}`,
        `Sitting: ${paper.session} ${paper.year}`,
        `Document: ${paper.type}`,
        '',
        'Demo document generated by the NOUS mock backend.',
      ],
    })
  );
}

function seedChapterPapers(path, chapterName) {
  return [
    { session: 'Autumn', type: 'Question paper', year: YEAR },
    { session: 'Spring', type: 'Question paper', year: YEAR },
  ].map((paper) =>
    seedDoc({
      id: nousSlug(`${paper.year}-${paper.session}-${paper.type}`),
      name: `${path} - ${paper.session} ${paper.year} ${paper.type}`,
      kind: 'past-paper',
      extra: { year: paper.year, session: paper.session, type: paper.type },
      body: [
        `Chapter: ${chapterName}`,
        `Sitting: ${paper.session} ${paper.year}`,
        '',
        'Demo document generated by the NOUS mock backend.',
      ],
    })
  );
}

function seedChapterSyllabus(path, chapterName) {
  return [
    seedDoc({
      id: 'syllabus-1',
      name: `${path} - Syllabus`,
      kind: 'syllabus',
      body: [
        `Chapter: ${chapterName}`,
        '',
        'Learning outcomes, weightings and the examinable scope for this chapter.',
      ],
    }),
  ];
}

/** One student note so the admin notes module has something to manage. */
function seedChapterNotes(path, chapterName) {
  return [
    seedDoc({
      id: 'note-1',
      name: `${path} - Student notes`,
      kind: 'note',
      uploadedBy: SEED_STUDENT,
      body: [
        `Chapter: ${chapterName}`,
        '',
        'Summary notes uploaded by a student and shared with everyone.',
      ],
    }),
  ];
}

function seedChapters(subjectPath, subjectName) {
  return Array.from({ length: CHAPTERS_PER_SUBJECT }, (_, index) => {
    const number = index + 1;
    const name = `Chapter ${number}`;
    const path = `${subjectPath} - ${name}`;
    const withDocs = index < SEEDED_CHAPTERS;

    return {
      id: `chapter-${number}`,
      name,
      title: `${subjectName} - ${name}`,
      status: STATUS.active,
      deleted: false,
      pastPapers: withDocs ? seedChapterPapers(path, name) : [],
      syllabus: withDocs ? seedChapterSyllabus(path, name) : [],
      notes: withDocs && number === 1 ? seedChapterNotes(path, name) : [],
    };
  });
}

export const NOUS_SEED_COURSES = SEED_CATALOG.map((course) => ({
  id: nousSlug(course.name),
  name: course.name,
  icon: course.icon,
  description: course.description,
  status: STATUS.active,
  deleted: false,
  levels: Object.entries(course.levels).map(([levelName, subjects]) => ({
    id: nousSlug(levelName),
    name: levelName,
    status: STATUS.active,
    deleted: false,
    subjects: subjects.map((subjectName) => {
      const path = `${course.name} ${levelName} ${subjectName}`;

      return {
        id: nousSlug(subjectName),
        name: subjectName,
        status: STATUS.active,
        deleted: false,
        chapters: seedChapters(path, subjectName),
        pastPapers: seedSubjectPapers(path, subjectName),
      };
    }),
  })),
}));

// ----------------------------------------------------------------------

/** Demo accounts - passwords are hashed by the mock server on first run. */
export const NOUS_SEED_USERS = [
  {
    id: 'user-admin',
    name: 'NOUS Admin',
    email: 'admin@nous.com',
    password: 'admin1234',
    role: 'admin',
    status: 'active',
  },
  {
    id: 'user-student',
    name: 'Demo Student',
    email: 'student@nous.com',
    password: 'student1234',
    role: 'user',
    status: 'active',
  },
];

// ----------------------------------------------------------------------

export const NOUS_SEED_SETTINGS = {
  logoPrefix: 'NO',
  logoSuffix: 'US',
  headerNote: 'CA & ACCA',
  homeTitle: 'Welcome to NOUS',
  homeSubtitle: 'Your organized learning platform for CA & ACCA',
  footerText: 'NOUS © 2026',
};
