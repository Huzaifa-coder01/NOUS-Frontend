import { paths } from 'src/routes/paths';

import { nousAccent } from 'src/theme/palette';
import { subjectTotals } from 'src/utils/catalog';

import { NousCard, PageTitle, BackButton, Breadcrumbs } from '../components';
import { CardsGrid, EmptyState } from '../styles';

// ----------------------------------------------------------------------

/** Step 3: the active subjects for the selected course + level. */
export function NousLevelView({ course, level }) {
  return (
    <>
      <BackButton href={paths.nous.course(course.id)} />

      <Breadcrumbs
        links={[
          { name: 'Home', href: paths.nous.root },
          { name: course.name, href: paths.nous.course(course.id) },
          { name: level.name },
        ]}
      />

      <PageTitle title={level.name} subtitle="Select a subject" />

      {level.subjects.length ? (
        <CardsGrid>
          {level.subjects.map((subject, index) => {
            const { chapters, pastPapers } = subjectTotals(subject);

            return (
              <NousCard
                key={subject.id}
                href={paths.nous.subject(course.id, level.id, subject.id)}
                icon={'\u{1F4D8}'}
                title={subject.name}
                description="Chapters and past papers"
                meta={`${chapters} chapters${pastPapers ? ` · ${pastPapers} past papers` : ''}`}
                accent={nousAccent(index)}
                action="Study"
              />
            );
          })}
        </CardsGrid>
      ) : (
        <EmptyState>
          <strong>No subjects available yet</strong>
          {`Subjects for ${level.name} appear here once an administrator publishes them.`}
        </EmptyState>
      )}
    </>
  );
}
