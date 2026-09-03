// ----------------------------------------------------------------------
// NOUS - seed data for the mock backend (src/lib/mock-server.js).
// This is only used the first time the app runs; afterwards the catalog lives
// in localStorage and is edited from the admin panel.
// ----------------------------------------------------------------------

export const CHAPTERS_PER_SUBJECT = 10;

export function nousSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ----------------------------------------------------------------------

/** Default resources created for every new chapter. */
export const DEFAULT_RESOURCES = [
  { id: 'syllabus', name: 'Syllabus', icon: '📋', description: 'View chapter syllabus' },
  { id: 'notes', name: 'Notes', icon: '📝', description: 'Study chapter notes' },
  { id: 'past-papers', name: 'Past Papers', icon: '📄', description: 'Practice previous questions' },
];

export const RESOURCE_ICONS = ['📋', '📝', '📄', '📕', '🎥', '🔗', '🧮', '🗂️', '⭐'];

export const PROGRAM_ICONS = ['📚', '🎓', '📖', '📘', '🏛️', '🧾', '💼'];

// ----------------------------------------------------------------------
// Past papers
// ----------------------------------------------------------------------

export const PAPER_SESSIONS = ['Spring', 'Summer', 'Autumn', 'Winter'];

/** Subject level: a whole exam paper. */
export const PAPER_TYPES = ['Question paper', 'Suggested answers', 'Examiner report'];

/** Chapter level: one past question mapped onto a chapter. */
export const QUESTION_TYPES = ['MCQ', 'Short question', 'Long question', 'Case study'];

export const PAPER_STATUS = ['published', 'draft'];

// ----------------------------------------------------------------------

const SEED_CATALOG = [
  {
    name: 'CA',
    icon: '📚',
    description: 'Explore PRC, CAF levels, subjects, chapters and study resources.',
    levels: {
      PRC: ['Business Mathematics', 'Introduction to Accounting', 'Business Economics'],
      'CAF 1': ['Accounting', 'Business Law', 'Economics', 'Quantitative Methods'],
      'CAF 2': ['Financial Accounting', 'Cost Accounting', 'Taxation', 'Business Finance'],
    },
  },
  {
    name: 'ACCA',
    icon: '🎓',
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

export function createSeedResources() {
  return DEFAULT_RESOURCES.map((resource) => ({ ...resource, content: '' }));
}

/** Four recent sittings per subject. */
function createSeedPastPapers(subjectName) {
  const year = new Date().getFullYear() - 1;

  return [
    { year, session: 'Autumn', type: 'Question paper' },
    { year, session: 'Spring', type: 'Question paper' },
    { year, session: 'Spring', type: 'Suggested answers' },
    { year: year - 1, session: 'Autumn', type: 'Question paper' },
  ].map((paper) => ({
    id: nousSlug(`${paper.year} ${paper.session} ${paper.type}`),
    title: `${subjectName} — ${paper.session} ${paper.year}`,
    year: paper.year,
    session: paper.session,
    type: paper.type,
    durationMins: 180,
    totalMarks: 100,
    fileUrl: '',
    status: 'published',
  }));
}

/** Two past questions attached to each chapter. */
function createSeedChapterPapers(subjectName, chapterNumber) {
  const year = new Date().getFullYear() - 1;

  return [
    { session: 'Autumn', type: 'Long question', marks: 15, number: chapterNumber },
    { session: 'Spring', type: 'MCQ', marks: 5, number: chapterNumber },
  ].map((paper) => ({
    id: nousSlug(`${year} ${paper.session} q${paper.number} ${paper.type}`),
    title: `Q${paper.number} — ${paper.session} ${year}`,
    year,
    session: paper.session,
    type: paper.type,
    marks: paper.marks,
    questionNo: `Q${paper.number}`,
    content: '',
    status: 'published',
  }));
}

function createSeedChapters(subjectName) {
  return Array.from({ length: CHAPTERS_PER_SUBJECT }, (_, index) => {
    const number = index + 1;

    return {
      id: `chapter-${number}`,
      name: `Chapter ${number}`,
      title: `${subjectName} - Chapter ${number}`,
      resources: createSeedResources(),
      pastPapers: createSeedChapterPapers(subjectName, number),
    };
  });
}

export const NOUS_SEED_PROGRAMS = SEED_CATALOG.map((program) => ({
  id: nousSlug(program.name),
  name: program.name,
  icon: program.icon,
  description: program.description,
  levels: Object.entries(program.levels).map(([levelName, subjects]) => ({
    id: nousSlug(levelName),
    name: levelName,
    subjects: subjects.map((subjectName) => ({
      id: nousSlug(subjectName),
      name: subjectName,
      chapters: createSeedChapters(subjectName),
      pastPapers: createSeedPastPapers(subjectName),
    })),
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
  logoPrefix: 'Study',
  logoSuffix: 'Hub',
  headerNote: 'CA & ACCA',
  homeTitle: 'Welcome to StudyHub',
  homeSubtitle: 'Your organized learning platform for CA & ACCA',
  footerText: 'StudyHub © 2026',
};
