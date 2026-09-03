import { paths } from 'src/routes/paths';

import { nousAccent } from 'src/theme/palette';

import { NousCard, PageTitle, BackButton, Breadcrumbs } from '../components';
import { CardsGrid } from '../styles';

// ----------------------------------------------------------------------

export function NousLevelView({ program, level }) {
  return (
    <>
      <BackButton href={paths.nous.program(program.id)} />

      <Breadcrumbs
        links={[
          { name: 'Home', href: paths.nous.root },
          { name: program.name, href: paths.nous.program(program.id) },
          { name: level.name },
        ]}
      />

      <PageTitle title={level.name} subtitle="Select a subject" />

      <CardsGrid>
        {level.subjects.map((subject, index) => {
          const papers = (subject.pastPapers ?? []).length;

          return (
            <NousCard
              key={subject.id}
              href={paths.nous.subject(program.id, level.id, subject.id)}
              icon="📘"
              title={subject.name}
              description="View chapters"
              meta={`${subject.chapters.length} chapters${papers ? ` · ${papers} papers` : ''}`}
              accent={nousAccent(index)}
              action="Study"
            />
          );
        })}
      </CardsGrid>
    </>
  );
}
