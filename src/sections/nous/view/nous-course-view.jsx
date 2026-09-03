import { paths } from 'src/routes/paths';

import { nousAccent } from 'src/theme/palette';
import { levelTotals } from 'src/utils/catalog';

import { NousCard, PageTitle, BackButton, Breadcrumbs } from '../components';
import { CardsGrid, EmptyState } from '../styles';

// ----------------------------------------------------------------------

/** Step 2: the active levels of the selected course. */
export function NousCourseView({ course }) {
  return (
    <>
      <BackButton href={paths.nous.root} />

      <Breadcrumbs links={[{ name: 'Home', href: paths.nous.root }, { name: course.name }]} />

      <PageTitle title={course.name} subtitle="Select your level" />

      {course.levels.length ? (
        <CardsGrid>
          {course.levels.map((level, index) => {
            const { subjects, chapters } = levelTotals(level);

            return (
              <NousCard
                key={level.id}
                href={paths.nous.level(course.id, level.id)}
                icon={'\u{1F4D6}'}
                title={level.name}
                description="Explore subjects"
                meta={`${subjects} subjects · ${chapters} chapters`}
                accent={nousAccent(index)}
              />
            );
          })}
        </CardsGrid>
      ) : (
        <EmptyState>
          <strong>No levels available yet</strong>
          {`Levels for ${course.name} appear here once an administrator publishes them.`}
        </EmptyState>
      )}
    </>
  );
}
