import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { activeOnly, chapterDocs } from 'src/utils/catalog';

import { PageTitle, BackButton, NoteUpload, Breadcrumbs, DocumentList } from '../components';

// ----------------------------------------------------------------------

const EMPTY_HINT = {
  syllabus: 'Syllabus PDFs for this chapter appear here once an administrator publishes them.',
  'past-paper':
    'Past paper PDFs for this chapter appear here once an administrator publishes them.',
  note: 'Be the first to share your notes for this chapter - upload a PDF above.',
};

/**
 * Step 6: the PDFs behind one chapter section, filtered to course + level +
 * subject + chapter. Notes is the only section a student can add to.
 */
export function NousSectionView({ course, level, subject, chapter, section }) {
  const docs = useMemo(
    () => activeOnly(chapterDocs(chapter, section.kind)),
    [chapter, section.kind]
  );

  const path = {
    courseId: course.id,
    levelId: level.id,
    subjectId: subject.id,
    chapterId: chapter.id,
  };

  return (
    <>
      <BackButton href={paths.nous.chapter(course.id, level.id, subject.id, chapter.id)} />

      <Breadcrumbs
        links={[
          { name: 'Home', href: paths.nous.root },
          { name: course.name, href: paths.nous.course(course.id) },
          { name: level.name, href: paths.nous.level(course.id, level.id) },
          { name: subject.name, href: paths.nous.subject(course.id, level.id, subject.id) },
          {
            name: chapter.name,
            href: paths.nous.chapter(course.id, level.id, subject.id, chapter.id),
          },
          { name: section.name },
        ]}
      />

      <PageTitle
        title={section.name}
        subtitle={`${subject.name} · ${chapter.name} · ${docs.length} PDF${docs.length === 1 ? '' : 's'}`}
      />

      {section.kind === 'note' && <NoteUpload path={path} />}

      <DocumentList
        docs={docs}
        emptyTitle={`No ${section.name.toLowerCase()} yet`}
        emptyHint={EMPTY_HINT[section.kind]}
      />
    </>
  );
}
