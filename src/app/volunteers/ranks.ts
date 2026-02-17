import styles from './ranks.module.css';

// Константи рангів (дублюємо логіку для консистентності)
// В ідеалі це варто винести в окремий файл constants.ts
export const RANKS = [
  { threshold: 10_000, title: 'Хранитель', className: styles.rankLegend },
  { threshold: 1000, title: 'Архіваріус', className: styles.rankArchivist },
  { threshold: 100, title: 'Реєстратор', className: styles.rankRegistrar },
  { threshold: 0, title: 'Писар', className: styles.rankScribe },
];

export function getRank(power: number) {
  return RANKS.find((r) => power >= r.threshold) || RANKS.at(-1);
}
