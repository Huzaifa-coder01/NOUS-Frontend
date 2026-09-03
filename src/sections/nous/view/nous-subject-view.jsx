import { paths } from 'src/routes/paths';

import { PageTitle, BackButton, ChapterCard, Breadcrumbs } from '../components';

// ----------------------------------------------------------------------

export function NousSubjectView({ program, level, subject }) {
  return (
    <>
      <BackButton href={paths.nous.level(program.id, level.id)} />

      <Breadcrumbs
        links={[
          { name: 'Home', href: paths.nous.root },
          { name: program.name, href: paths.nous.program(program.id) },
          { name: level.name, href: paths.nous.level(program.id, level.id) },
          { name: subject.name },
        ]}
      />

      <PageTitle
        title={subject.name}
        subtitle={`${subject.chapters.length} chapters · select one to open its resources`}
      />

      {subject.chapters.map((chapter, index) => (
        <ChapterCard
          key={chapter.id}
          index={index}
          href={paths.nous.chapter(program.id, level.id, subject.id, chapter.id)}
          chapter={chapter}
        />
      ))}
    </>
  );
}
