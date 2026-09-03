import { paths } from 'src/routes/paths';

import { nousAccent } from 'src/theme/palette';
import { countActive, chapterDocs } from 'src/utils/catalog';

import { CHAPTER_SECTIONS } from 'src/_mock/_nous';

import { PageTitle, BackButton, Breadcrumbs, SectionCard } from '../components';
import { ResourcesGrid } from '../styles';

// ----------------------------------------------------------------------

/** Step 5: the three cards every chapter offers - Syllabus, Notes, Past Papers. */
export function NousChapterView({ course, level, subject, chapter }) {
  return (
    <>
      <BackButton href={paths.nous.subject(course.id, level.id, subject.id)} />

      <Breadcrumbs
        links={[
          { name: 'Home', href: paths.nous.root },
          { name: course.name, href: paths.nous.course(course.id) },
          { name: level.name, href: paths.nous.level(course.id, level.id) },
          { name: subject.name, href: paths.nous.subject(course.id, level.id, subject.id) },
          { name: chapter.name },
        ]}
      />

      <PageTitle title={chapter.title || chapter.name} subtitle={subject.name} />

      <ResourcesGrid>
        {CHAPTER_SECTIONS.map((section, index) => (
          <SectionCard
            key={section.id}
            href={paths.nous.section(course.id, level.id, subject.id, chapter.id, section.id)}
            icon={section.icon}
            name={section.name}
            description={section.description}
            accent={nousAccent(index)}
            count={countActive(chapterDocs(chapter, section.kind))}
          />
        ))}
      </ResourcesGrid>
    </>
  );
}
