export default function TableEditorCellValue({ value }: { value: unknown }) {
  if (typeof value === 'string') {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      try {
        const url = new URL(value);
        return (
          <a href={url.toString()} target="_blank" rel="noreferrer">
            {url.hostname}
          </a>
        );
      } catch {
        // Ignore
      }
      return <span>{value}</span>;
    }
    return <span>{value}</span>;
  }
  if (typeof value === 'number') {
    return <span>{value}</span>;
  }
  if (typeof value === 'boolean') {
    return <span>{value ? 'true' : 'false'}</span>;
  }
  return <span>{JSON.stringify(value)}</span>;
}
