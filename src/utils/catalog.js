import { STATUS, DOC_KINDS } from 'src/_mock/_nous';

// ----------------------------------------------------------------------
// Visibility
//
// The mock server already cascades `inactive` down the tree when an admin
// switches a node off, but the student site never relies on that alone: it
// re-derives visibility from the ancestor chain on every read, so a record that
// slipped through (an older database, a half applied write) can still never be
// shown to a student.
// ----------------------------------------------------------------------

export function isActive(node) {
  return !!node && node.status === STATUS.active && !node.deleted;
}

export function isDeleted(node) {
  return !!node?.deleted;
}

export function activeOnly(list) {
  return (list ?? []).filter(isActive);
}

export function notDeleted(list) {
  return (list ?? []).filter((item) => !item.deleted);
}

// ----------------------------------------------------------------------

function pruneChapter(chapter, keep) {
  return {
    ...chapter,
    pastPapers: keep(chapter.pastPapers),
    syllabus: keep(chapter.syllabus),
    notes: keep(chapter.notes),
  };
}

function pruneSubject(subject, keep) {
  return {
    ...subject,
    pastPapers: keep(subject.pastPapers),
    chapters: keep(subject.chapters).map((chapter) => pruneChapter(chapter, keep)),
  };
}

function pruneCourse(course, keep) {
  return {
    ...course,
    levels: keep(course.levels).map((level) => ({
      ...level,
      subjects: keep(level.subjects).map((subject) => pruneSubject(subject, keep)),
    })),
  };
}

function prune(courses, keep) {
  return keep(courses ?? []).map((course) => pruneCourse(course, keep));
}

/** Everything a student may see: active, not deleted, at every level. */
export function selectActiveTree(courses) {
  return prune(courses, activeOnly);
}

/** Everything the admin navigates: deleted nodes are dropped, inactive stay. */
export function selectAdminTree(courses) {
  return prune(courses, notDeleted);
}

// ----------------------------------------------------------------------
// Counters used on the cards
// ----------------------------------------------------------------------

export function countActive(list) {
  return activeOnly(list).length;
}

export function chapterDocs(chapter, kind) {
  return chapter?.[DOC_KINDS[kind]] ?? [];
}

/** Active chapters + active subject level past papers, for the subject page. */
export function subjectTotals(subject) {
  const chapters = activeOnly(subject?.chapters);

  return {
    chapters: chapters.length,
    pastPapers: countActive(subject?.pastPapers),
    syllabus: chapters.reduce((total, chapter) => total + countActive(chapter.syllabus), 0),
    notes: chapters.reduce((total, chapter) => total + countActive(chapter.notes), 0),
  };
}

export function levelTotals(level) {
  const subjects = activeOnly(level?.subjects);

  return {
    subjects: subjects.length,
    chapters: subjects.reduce((total, subject) => total + countActive(subject.chapters), 0),
  };
}

export function courseTotals(course) {
  const levels = activeOnly(course?.levels);

  return levels.reduce(
    (totals, level) => {
      const { subjects, chapters } = levelTotals(level);

      return {
        levels: totals.levels + 1,
        subjects: totals.subjects + subjects,
        chapters: totals.chapters + chapters,
      };
    },
    { levels: 0, subjects: 0, chapters: 0 }
  );
}

// ----------------------------------------------------------------------
// Flat views of the tree, for the admin modules that list one node type
// across the whole catalog.
// ----------------------------------------------------------------------

/**
 * A node is only reachable by a student when it and every ancestor is active.
 * `hiddenByParent` marks the confusing case: switched on itself, but buried
 * under something that is switched off.
 */
function visibility(chain) {
  const own = chain[chain.length - 1];
  const ancestorsActive = chain.slice(0, -1).every(isActive);

  return {
    effectiveStatus: isActive(own) && ancestorsActive ? STATUS.active : STATUS.inactive,
    hiddenByParent: isActive(own) && !ancestorsActive,
  };
}

/**
 * One row per level, subject and chapter, each carrying the names and ids of
 * everything above it so a flat list can show - and link to - its place in the
 * catalog.
 */
export function flattenTree(courses) {
  const levels = [];
  const subjects = [];
  const chapters = [];

  (courses ?? []).forEach((course) =>
    (course.levels ?? []).forEach((level) => {
      levels.push({
        ...level,
        rowId: `${course.id}/${level.id}`,
        path: { courseId: course.id, levelId: level.id },
        course,
        courseName: course.name,
        ...visibility([course, level]),
      });

      (level.subjects ?? []).forEach((subject) => {
        subjects.push({
          ...subject,
          rowId: `${course.id}/${level.id}/${subject.id}`,
          path: { courseId: course.id, levelId: level.id, subjectId: subject.id },
          course,
          level,
          courseName: course.name,
          levelName: level.name,
          ...visibility([course, level, subject]),
        });

        (subject.chapters ?? []).forEach((chapter) => {
          chapters.push({
            ...chapter,
            rowId: `${course.id}/${level.id}/${subject.id}/${chapter.id}`,
            path: {
              courseId: course.id,
              levelId: level.id,
              subjectId: subject.id,
              chapterId: chapter.id,
            },
            course,
            level,
            subject,
            courseName: course.name,
            levelName: level.name,
            subjectName: subject.name,
            ...visibility([course, level, subject, chapter]),
          });
        });
      });
    })
  );

  return { levels, subjects, chapters };
}
