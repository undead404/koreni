export default function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КіБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МіБ`;
}
