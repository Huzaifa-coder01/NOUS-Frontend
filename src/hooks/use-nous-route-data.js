import { useParams } from 'react-router-dom';

import { useNousData } from 'src/context/nous-data';

import { sectionByRouteId } from 'src/_mock/_nous';

// ----------------------------------------------------------------------

/**
 * Resolves the `/:courseId/:levelId/:subjectId/:chapterId/:sectionId` url
 * segments against the catalog.
 *
 * `scope` decides which tree is walked, and that is the whole visibility story
 * for the student site: on `student` the hook only ever sees active, undeleted
 * records, so an item switched off in the admin panel resolves to `notFound`
 * and the page redirects instead of rendering.
 */
export function useNousRouteData({ scope = 'student' } = {}) {
  const { courseId, levelId, subjectId, chapterId, sectionId } = useParams();

  const { activeCourses, adminCourses, loading } = useNousData();

  const courses = scope === 'admin' ? adminCourses : activeCourses;

  const course = courseId ? courses.find((item) => item.id === courseId) : undefined;

  const level = levelId ? course?.levels.find((item) => item.id === levelId) : undefined;

  const subject = subjectId ? level?.subjects.find((item) => item.id === subjectId) : undefined;

  const chapter = chapterId ? subject?.chapters.find((item) => item.id === chapterId) : undefined;

  const section = sectionId ? sectionByRouteId(sectionId) : undefined;

  const notFound =
    !loading &&
    ((!!courseId && !course) ||
      (!!levelId && !level) ||
      (!!subjectId && !subject) ||
      (!!chapterId && !chapter) ||
      (!!sectionId && !section));

  return { loading, course, level, subject, chapter, section, notFound };
}
