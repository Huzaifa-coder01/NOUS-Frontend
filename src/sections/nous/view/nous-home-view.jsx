import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { nousAccent } from 'src/theme/palette';
import { courseTotals } from 'src/utils/catalog';
import { useNousData } from 'src/context/nous-data';

import { useAuthContext } from 'src/auth/hooks';

import { Hero, NousCard } from '../components';
import { CardsGrid, EmptyState } from '../styles';

// ----------------------------------------------------------------------

/** Step 1 of the student flow: every active course. */
export function NousHomeView() {
  const { activeCourses, settings } = useNousData();

  const { user } = useAuthContext();

  const totals = useMemo(
    () =>
      activeCourses.reduce(
        (sum, course) => {
          const course_ = courseTotals(course);

          return {
            levels: sum.levels + course_.levels,
            subjects: sum.subjects + course_.subjects,
            chapters: sum.chapters + course_.chapters,
          };
        },
        { levels: 0, subjects: 0, chapters: 0 }
      ),
    [activeCourses]
  );

  const firstName = user?.name?.split(' ')[0];

  return (
    <>
      <Hero
        title={
          firstName ? `Welcome back, ${firstName}` : settings?.homeTitle ?? 'Welcome to NOUS'
        }
        subtitle={settings?.homeSubtitle ?? 'Your organized learning platform for CA & ACCA'}
        stats={[
          `${activeCourses.length} courses`,
          `${totals.subjects} subjects`,
          `${totals.chapters} chapters`,
        ]}
      />

      {activeCourses.length ? (
        <CardsGrid>
          {activeCourses.map((course, index) => {
            const { levels, subjects } = courseTotals(course);

            return (
              <NousCard
                key={course.id}
                href={paths.nous.course(course.id)}
                icon={course.icon}
                title={course.name}
                description={course.description}
                meta={`${levels} levels · ${subjects} subjects`}
                accent={nousAccent(index)}
                action="Explore"
              />
            );
          })}
        </CardsGrid>
      ) : (
        <EmptyState>
          <strong>No courses available yet</strong>
          Courses appear here as soon as an administrator publishes them.
        </EmptyState>
      )}
    </>
  );
}
