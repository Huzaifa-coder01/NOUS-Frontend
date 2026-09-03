import { paths } from 'src/routes/paths';

import { PageTitle, BackButton, Breadcrumbs } from '../components';
import { StaticCard, PaperList, PaperItem } from '../styles';

// ----------------------------------------------------------------------

function published(items) {
  return (items ?? []).filter((item) => item.status !== 'draft');
}

// ----------------------------------------------------------------------

export function NousResourceView({ program, level, subject, chapter, resource }) {
  const content = resource.content?.trim();

  // the "Past Papers" resource is backed by the past papers module rather than
  // a block of text: chapter questions first, then the subject's full papers
  const isPastPapers = resource.id === 'past-papers';

  const chapterPapers = isPastPapers ? published(chapter.pastPapers) : [];

  const subjectPapers = isPastPapers ? published(subject.pastPapers) : [];

  const hasPapers = chapterPapers.length > 0 || subjectPapers.length > 0;

  return (
    <>
      <BackButton href={paths.nous.chapter(program.id, level.id, subject.id, chapter.id)} />

      <Breadcrumbs
        links={[
          { name: 'Home', href: paths.nous.root },
          { name: program.name, href: paths.nous.program(program.id) },
          { name: level.name, href: paths.nous.level(program.id, level.id) },
          { name: subject.name, href: paths.nous.subject(program.id, level.id, subject.id) },
          {
            name: chapter.name,
            href: paths.nous.chapter(program.id, level.id, subject.id, chapter.id),
          },
          { name: resource.name },
        ]}
      />

      <PageTitle
        title={resource.name}
        subtitle={
          content || hasPapers ? `${subject.name} · ${chapter.name}` : 'Content will appear here.'
        }
      />

      <StaticCard>
        <h2>{resource.name}</h2>
        <br />

        {isPastPapers && hasPapers && (
          <>
            {chapterPapers.length > 0 && (
              <>
                <p>
                  <strong>Questions from this chapter</strong>
                </p>
                <PaperList>
                  {chapterPapers.map((paper) => (
                    <PaperItem key={paper.id}>
                      <div>
                        <strong>{paper.title}</strong>
                        <div className="paper-meta">
                          {paper.questionNo ? `${paper.questionNo} · ` : ''}
                          {paper.type} · {paper.marks} marks
                        </div>
                        {paper.content?.trim() && (
                          <div className="paper-body">{paper.content}</div>
                        )}
                      </div>
                      <div>
                        {paper.session} {paper.year}
                      </div>
                    </PaperItem>
                  ))}
                </PaperList>
                <br />
              </>
            )}

            {subjectPapers.length > 0 && (
              <>
                <p>
                  <strong>Full papers for {subject.name}</strong>
                </p>
                <PaperList>
                  {subjectPapers.map((paper) => (
                    <PaperItem key={paper.id}>
                      <div>
                        <strong>{paper.title}</strong>
                        <div className="paper-meta">
                          {paper.type}
                          {paper.totalMarks ? ` · ${paper.totalMarks} marks` : ''}
                          {paper.durationMins ? ` · ${paper.durationMins} mins` : ''}
                        </div>
                      </div>
                      <div>
                        {paper.fileUrl ? (
                          <a href={paper.fileUrl} target="_blank" rel="noreferrer">
                            Download
                          </a>
                        ) : (
                          `${paper.session} ${paper.year}`
                        )}
                      </div>
                    </PaperItem>
                  ))}
                </PaperList>
              </>
            )}
          </>
        )}

        {!isPastPapers &&
          (content ? (
            // authored in the admin panel; blank lines start a new paragraph
            content.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index} style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>
                {paragraph}
              </p>
            ))
          ) : (
            <>
              <p>This section is ready for your {resource.name.toLowerCase()}.</p>
              <br />
              <p>
                Later we can connect PDFs, online notes, videos, links, downloads or database
                content here.
              </p>
            </>
          ))}

        {isPastPapers && !hasPapers && (
          <>
            <p>This section is ready for your {resource.name.toLowerCase()}.</p>
            <br />
            <p>
              Add past papers from the admin panel — questions on the chapter, full papers on the
              subject.
            </p>
          </>
        )}
      </StaticCard>
    </>
  );
}
