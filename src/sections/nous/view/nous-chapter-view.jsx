import { paths } from 'src/routes/paths';

import { nousAccent } from 'src/theme/palette';

import { PageTitle, BackButton, Breadcrumbs, ResourceCard } from '../components';
import { ResourcesGrid } from '../styles';

// ----------------------------------------------------------------------

/** How many items sit behind each resource card. */
function resourceCount(resource, subject, chapter) {
  if (resource.id === 'past-papers') {
    const chapterPapers = (chapter.pastPapers ?? []).filter((item) => item.status !== 'draft');
    const subjectPapers = (subject.pastPapers ?? []).filter((item) => item.status !== 'draft');

    return chapterPapers.length + subjectPapers.length;
  }

  return resource.content?.trim() ? 1 : 0;
}

export function NousChapterView({ program, level, subject, chapter }) {
  return (
    <>
      <BackButton href={paths.nous.subject(program.id, level.id, subject.id)} />

      <Breadcrumbs
        links={[
          { name: 'Home', href: paths.nous.root },
          { name: program.name, href: paths.nous.program(program.id) },
          { name: level.name, href: paths.nous.level(program.id, level.id) },
          { name: subject.name, href: paths.nous.subject(program.id, level.id, subject.id) },
          { name: chapter.name },
        ]}
      />

      <PageTitle title={chapter.title || chapter.name} subtitle={subject.name} />

      <ResourcesGrid>
        {(chapter.resources ?? []).map((resource, index) => (
          <ResourceCard
            key={resource.id}
            href={paths.nous.resource(program.id, level.id, subject.id, chapter.id, resource.id)}
            resource={resource}
            accent={nousAccent(index)}
            count={resourceCount(resource, subject, chapter)}
          />
        ))}
      </ResourcesGrid>
    </>
  );
}
