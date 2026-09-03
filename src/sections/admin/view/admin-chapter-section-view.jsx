import { chapterDocs } from 'src/utils/catalog';

import { AdminDocsView, docLinks } from './admin-docs-view';

// ----------------------------------------------------------------------

/**
 * The syllabus / notes / past papers of one chapter, filtered by course, level,
 * subject and chapter.
 */
export function AdminChapterSectionView({ course, level, subject, chapter, section }) {
  return (
    <AdminDocsView
      kind={section.kind}
      heading={`${section.name} - ${chapter.name}`}
      path={{
        courseId: course.id,
        levelId: level.id,
        subjectId: subject.id,
        chapterId: chapter.id,
      }}
      rows={chapterDocs(chapter, section.kind)}
      links={docLinks({ course, level, subject, chapter, current: section.name })}
    />
  );
}
