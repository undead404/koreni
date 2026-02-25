import styles from './highlighted-text.module.css';
// --- Safe Highlighting Utilities ---
const escapeRegExp = (string: string) =>
  string.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

export default function HighlightedText({
  text,
  tokens,
}: {
  text: string;
  tokens: string[];
}) {
  if (!text || tokens.length === 0) return <>{text}</>;
  const safeTokens = tokens.map((token) => escapeRegExp(token)).filter(Boolean);
  if (safeTokens.length === 0) return <>{text}</>;

  const regex = new RegExp(`(${safeTokens.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        tokens.some((token) => token.toLowerCase() === part.toLowerCase()) ? (
          <mark key={index} className={styles.highlightMarker}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
