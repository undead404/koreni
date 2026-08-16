import type { ProjectImage } from '../../schemata';

const parsePageName = (name: string) => {
  const match = name.match(/^(\d+)([aа]?)(зв)?$/);
  if (!match) return null;
  return {
    n: Number.parseInt(match[1], 10),
    suffix: match[2].replace('a', 'а'), // normalize to Cyrillic 'а'
    zv: !!match[3],
  };
};

export function guessNextPageName(
  currentIndex: number,
  images: ProjectImage[],
): string | null {
  if (currentIndex < 2) return null;

  const previousImages = images.slice(0, currentIndex);
  if (previousImages.some((img) => !img.pageName)) return null;

  const previous2Name = images[currentIndex - 2].pageName;
  const previous1Name = images[currentIndex - 1].pageName;

  if (!previous2Name || !previous1Name) return null;

  const p2 = parsePageName(previous2Name);
  const p1 = parsePageName(previous1Name);

  if (!p2 || !p1) return null;

  // Case 1: prev2: "N", prev1: "M", N + 1 = M -> guess "(M + 1)"
  if (!p2.suffix && !p2.zv && !p1.suffix && !p1.zv && p2.n + 1 === p1.n) {
    return (p1.n + 1).toString();
  }

  // Case 2: prev2: "Nзв", prev1: "M", N + 1 = M -> guess "Mзв"
  if (!p2.suffix && p2.zv && !p1.suffix && !p1.zv && p2.n + 1 === p1.n) {
    return `${p1.n}зв`;
  }

  // Case 3: prev2: "N", prev1: "Nзв" -> guess "(N + 1)"
  if (!p2.suffix && !p2.zv && !p1.suffix && p1.zv && p2.n === p1.n) {
    return (p1.n + 1).toString();
  }

  // Case 4: prev2: "N", prev1: "Nа" -> guess "(N + 1)"
  if (!p2.suffix && !p2.zv && p1.suffix === 'а' && !p1.zv && p2.n === p1.n) {
    return (p1.n + 1).toString();
  }

  // Case 5: prev2: "Na", prev1: "M", where N + 1 = M, guess `(M + 1).toString()`.
  if (
    p2.suffix === 'а' &&
    !p2.zv &&
    !p1.suffix &&
    !p1.zv &&
    p2.n + 1 === p1.n
  ) {
    return (p1.n + 1).toString();
  }

  // Case 6: prev2: "Nзв", prev1: "Nа", guess `"Nазв"`.
  if (!p2.suffix && p2.zv && p1.suffix === 'а' && !p1.zv && p2.n === p1.n) {
    return `${p1.n}азв`;
  }

  // Case 7: prev2: "Nа", prev1: "Naзв", guess `(N + 1).toString()`.
  if (
    p2.suffix === 'а' &&
    !p2.zv &&
    p1.suffix === 'а' &&
    p1.zv &&
    p2.n === p1.n
  ) {
    return (p1.n + 1).toString();
  }

  return null;
}
