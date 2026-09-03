import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { nousAccent } from 'src/theme/palette';
import { useNousData } from 'src/context/nous-data';

import { useAuthContext } from 'src/auth/hooks';

import { Hero, NousCard } from '../components';
import { CardsGrid } from '../styles';

// ----------------------------------------------------------------------

export function NousHomeView() {
  const { programs, settings } = useNousData();

  const { user } = useAuthContext();

  const totals = useMemo(() => {
    const levels = programs.flatMap((program) => program.levels);
    const subjects = levels.flatMap((level) => level.subjects);
    const chapters = subjects.flatMap((subject) => subject.chapters);

    return { levels: levels.length, subjects: subjects.length, chapters: chapters.length };
  }, [programs]);

  const firstName = user?.name?.split(' ')[0];

  return (
    <>
      <Hero
        title={
          firstName ? `Welcome back, ${firstName}` : (settings?.homeTitle ?? 'Welcome to StudyHub')
        }
        subtitle={settings?.homeSubtitle ?? 'Your organized learning platform for CA & ACCA'}
        stats={[
          `${programs.length} programs`,
          `${totals.subjects} subjects`,
          `${totals.chapters} chapters`,
        ]}
      />

      <CardsGrid>
        {programs.map((program, index) => {
          const subjects = program.levels.reduce(
            (total, level) => total + level.subjects.length,
            0
          );

          return (
            <NousCard
              key={program.id}
              href={paths.nous.program(program.id)}
              icon={program.icon}
              title={program.name}
              description={program.description}
              meta={`${program.levels.length} levels · ${subjects} subjects`}
              accent={nousAccent(index)}
              action="Explore"
            />
          );
        })}
      </CardsGrid>
    </>
  );
}
