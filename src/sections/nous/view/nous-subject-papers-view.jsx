import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { activeOnly } from 'src/utils/catalog';

import { PageTitle, BackButton, Breadcrumbs, DocumentList } from '../components';

// ----------------------------------------------------------------------

/**
 * Past papers reached straight from the subject page: filtered by course,
 * level and subject only - chapter past papers live on the chapter.
 */
export function NousSubjectPapersView({ course, level, subject }) {
  const docs = useMemo(() => activeOnly(subject.pastPapers), [subject.pastPapers]);

  return (
    <>
      <BackButton href={paths.nous.subject(course.id, level.id, subject.id)} />

      <Breadcrumbs
        links={[
          { name: 'Home', href: paths.nous.root },
          { name: course.name, href: paths.nous.course(course.id) },
          { name: level.name, href: paths.nous.level(course.id, level.id) },
          { name: subject.name, href: paths.nous.subject(course.id, level.id, subject.id) },
          { name: 'Past Papers' },
        ]}
      />

      <PageTitle
        title="Past Papers"
        subtitle={`${course.name} · ${level.name} · ${subject.name} · ${docs.length} PDF${docs.length === 1 ? '' : 's'}`}
      />

      <DocumentList
        docs={docs}
        emptyTitle="No past papers yet"
        emptyHint={`Past papers for ${subject.name} appear here once an administrator publishes them.`}
      />
    </>
  );
}
