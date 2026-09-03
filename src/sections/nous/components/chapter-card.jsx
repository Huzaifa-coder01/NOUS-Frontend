import { ChapterCardRoot } from '../styles';

// ----------------------------------------------------------------------

export function ChapterCard({ href, chapter, index }) {
  return (
    <ChapterCardRoot href={href}>
      <div className="chapter-badge">{index + 1}</div>

      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <span className="chapter-number">{chapter.name}</span>
        <strong>{chapter.title || chapter.name}</strong>
      </div>

      <div className="chapter-go">→</div>
    </ChapterCardRoot>
  );
}
