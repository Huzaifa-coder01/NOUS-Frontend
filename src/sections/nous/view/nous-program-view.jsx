import { paths } from 'src/routes/paths';

import { nousAccent } from 'src/theme/palette';

import { NousCard, PageTitle, BackButton, Breadcrumbs } from '../components';
import { CardsGrid } from '../styles';

// ----------------------------------------------------------------------

export function NousProgramView({ program }) {
  return (
    <>
      <BackButton href={paths.nous.root} />

      <Breadcrumbs links={[{ name: 'Home', href: paths.nous.root }, { name: program.name }]} />

      <PageTitle title={program.name} subtitle="Select your level" />

      <CardsGrid>
        {program.levels.map((level, index) => {
          const chapters = level.subjects.reduce(
            (total, subject) => total + subject.chapters.length,
            0
          );

          return (
            <NousCard
              key={level.id}
              href={paths.nous.level(program.id, level.id)}
              icon="📖"
              title={level.name}
              description="Explore subjects"
              meta={`${level.subjects.length} subjects · ${chapters} chapters`}
              accent={nousAccent(index)}
            />
          );
        })}
      </CardsGrid>
    </>
  );
}
