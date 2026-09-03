import { AdminDocsView, docLinks } from './admin-docs-view';

// ----------------------------------------------------------------------

/** Past papers that belong to a whole subject: course + level + subject. */
export function AdminSubjectPapersView({ course, level, subject }) {
  return (
    <AdminDocsView
      kind="past-paper"
      heading="Subject past papers"
      path={{ courseId: course.id, levelId: level.id, subjectId: subject.id }}
      rows={subject.pastPapers ?? []}
      links={docLinks({ course, level, subject, current: 'Past papers' })}
    />
  );
}
