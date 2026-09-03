import { ResourceCardRoot } from '../styles';

// ----------------------------------------------------------------------

export function ResourceCard({ href, resource, accent, count }) {
  return (
    <ResourceCardRoot href={href} accent={accent}>
      <div className="resource-icon">{resource.icon}</div>

      <h3>{resource.name}</h3>
      <p>{resource.description}</p>

      {count !== undefined && (
        <span className="resource-count">{count > 0 ? `${count} available` : 'Coming soon'}</span>
      )}
    </ResourceCardRoot>
  );
}
