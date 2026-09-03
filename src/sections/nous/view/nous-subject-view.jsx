import { paths } from 'src/routes/paths';

import { nousAccent } from 'src/theme/palette';
import { countActive } from 'src/utils/catalog';

import { NousCard, PageTitle, BackButton, ChapterCard, Breadcrumbs } from '../components';
import { CardsGrid, EmptyState, ListHeading } from '../styles';

// ----------------------------------------------------------------------

/**
 * Step 4: the active chapters for course + level + subject, plus the subject's
 * own past papers - reachable straight from here without opening a chapter.
 */
export function NousSubjectView({ course, level, subject }) {
  const pastPapers = countActive(subject.pastPapers);

  return (
    <>
      <BackButton href={paths.nous.level(course.id, level.id)} />

      <Breadcrumbs
        links={[
          { name: 'Home', href: paths.nous.root },
          { name: course.name, href: paths.nous.course(course.id) },
          { name: level.name, href: paths.nous.level(course.id, level.id) },
          { name: subject.name },
        ]}
      />

      <PageTitle
        title={subject.name}
        subtitle={`${subject.chapters.length} chapters · ${pastPapers} past papers`}
      />

      <CardsGrid>
        <NousCard
          href={paths.nous.subjectPastPapers(course.id, level.id, subject.id)}
          icon={'\u{1F4C4}'}
          title="Past Papers"
          description={`Every past paper for ${subject.name}`}
          meta={`${pastPapers} PDF${pastPapers === 1 ? '' : 's'}`}
          accent={nousAccent(2)}
          action="Open"
        />
      </CardsGrid>

      <ListHeading>
        Chapters <span>select one to open its syllabus, notes and past papers</span>
      </ListHeading>

      {subject.chapters.length ? (
        subject.chapters.map((chapter, index) => (
          <ChapterCard
            key={chapter.id}
            index={index}
            href={paths.nous.chapter(course.id, level.id, subject.id, chapter.id)}
            chapter={chapter}
          />
        ))
      ) : (
        <EmptyState>
          <strong>No chapters available yet</strong>
          {`Chapters for ${subject.name} appear here once an administrator publishes them.`}
        </EmptyState>
      )}
    </>
  );
}
