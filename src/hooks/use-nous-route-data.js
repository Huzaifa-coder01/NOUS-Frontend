import { useParams } from 'react-router-dom';

import { useNousData } from 'src/context/nous-data';

// ----------------------------------------------------------------------

/**
 * Resolves the `/programs/:programId/:levelId/:subjectId/:chapterId/:resourceId`
 * url segments against the live catalog. `notFound` is true as soon as a segment
 * present in the url does not match a record.
 */
export function useNousRouteData() {
  const { programId, levelId, subjectId, chapterId, resourceId } = useParams();

  const { programs, loading } = useNousData();

  const program = programId ? programs.find((item) => item.id === programId) : undefined;

  const level = levelId ? program?.levels.find((item) => item.id === levelId) : undefined;

  const subject = subjectId ? level?.subjects.find((item) => item.id === subjectId) : undefined;

  const chapter = chapterId ? subject?.chapters.find((item) => item.id === chapterId) : undefined;

  const resource = resourceId
    ? chapter?.resources?.find((item) => item.id === resourceId)
    : undefined;

  const notFound =
    !loading &&
    ((!!programId && !program) ||
      (!!levelId && !level) ||
      (!!subjectId && !subject) ||
      (!!chapterId && !chapter) ||
      (!!resourceId && !resource));

  return { loading, program, level, subject, chapter, resource, notFound };
}
