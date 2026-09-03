// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  ADMIN: '/admin',
  PROGRAMS: '/programs',
};

// ----------------------------------------------------------------------

export const paths = {
  page404: '/404',

  // Public StudyHub site
  nous: {
    root: '/',
    programs: ROOTS.PROGRAMS,
    program: (programId) => `${ROOTS.PROGRAMS}/${programId}`,
    level: (programId, levelId) => `${ROOTS.PROGRAMS}/${programId}/${levelId}`,
    subject: (programId, levelId, subjectId) =>
      `${ROOTS.PROGRAMS}/${programId}/${levelId}/${subjectId}`,
    chapter: (programId, levelId, subjectId, chapterId) =>
      `${ROOTS.PROGRAMS}/${programId}/${levelId}/${subjectId}/${chapterId}`,
    resource: (programId, levelId, subjectId, chapterId, resourceId) =>
      `${ROOTS.PROGRAMS}/${programId}/${levelId}/${subjectId}/${chapterId}/${resourceId}`,
  },

  // Auth
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/sign-in`,
      signUp: `${ROOTS.AUTH}/sign-up`,
      forgetPassword: `${ROOTS.AUTH}/forget-password`,
      verifyPassword: `${ROOTS.AUTH}/verify-password`,
      resetPassword: `${ROOTS.AUTH}/reset-password`,
    },
  },

  // Admin panel
  admin: {
    root: ROOTS.ADMIN,
    users: `${ROOTS.ADMIN}/users`,
    pastPapers: `${ROOTS.ADMIN}/past-papers`,
    profile: `${ROOTS.ADMIN}/profile`,
    settings: `${ROOTS.ADMIN}/settings`,
    catalog: {
      root: `${ROOTS.ADMIN}/catalog`,
      program: (programId) => `${ROOTS.ADMIN}/catalog/${programId}`,
      level: (programId, levelId) => `${ROOTS.ADMIN}/catalog/${programId}/${levelId}`,
      subject: (programId, levelId, subjectId) =>
        `${ROOTS.ADMIN}/catalog/${programId}/${levelId}/${subjectId}`,
      subjectPapers: (programId, levelId, subjectId) =>
        `${ROOTS.ADMIN}/catalog/${programId}/${levelId}/${subjectId}/past-papers`,
      chapter: (programId, levelId, subjectId, chapterId) =>
        `${ROOTS.ADMIN}/catalog/${programId}/${levelId}/${subjectId}/${chapterId}`,
      chapterPapers: (programId, levelId, subjectId, chapterId) =>
        `${ROOTS.ADMIN}/catalog/${programId}/${levelId}/${subjectId}/${chapterId}/past-papers`,
    },
  },
};
