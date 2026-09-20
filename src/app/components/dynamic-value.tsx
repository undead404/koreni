import HighlightedText from './highlighted-text';

import styles from './dynamic-value.module.css';

export interface DynamicValueProperties {
  value: unknown;
  tokens: string[];
}

export default function DynamicValue({
  value,
  tokens,
}: DynamicValueProperties) {
  if (([null, undefined, ''] as unknown[]).includes(value)) {
    return <span className={styles.emptyValue}>—</span>;
  }

  if (typeof value === 'string') {
    return <HighlightedText text={value} tokens={tokens} />;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span>{value.toString()}</span>;
  }

  // Recursively handle nested ambiguous data without crashing or hiding it
  if (typeof value === 'object') {
    return (
      <pre className={styles.objectFallback}>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return null;
}
