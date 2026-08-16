export type ArchiveReference = {
  archive: string;
  fond: string;
  opys: string;
  sprava: string;
  raw: string;
};

const CYRILLIC_WORD = /^\p{Script=Cyrillic}+$/u;
const SINGLE_CYRILLIC_LETTER = /^\p{Script=Cyrillic}$/u;

const buildUnparsed = (raw: string): ArchiveReference => ({
  archive: '',
  fond: '',
  opys: '',
  sprava: '',
  raw,
});

export default function parseArchiveReference(raw: string): ArchiveReference {
  const trimmed = raw.trim();
  const firstSeparator = trimmed.search(/[-\s]/);
  if (firstSeparator === -1) return buildUnparsed(trimmed);

  const archive = trimmed.slice(0, firstSeparator);
  if (!CYRILLIC_WORD.test(archive)) return buildUnparsed(trimmed);

  const rest = trimmed.slice(firstSeparator + 1);
  const parts = rest.split('-');
  if (parts.length < 3) return buildUnparsed(trimmed);

  let fond: string;
  let opys: string;
  let sprava: string;
  if (parts.length === 3) {
    [fond, opys, sprava] = parts;
  } else if (parts.length === 4 && SINGLE_CYRILLIC_LETTER.test(parts[0])) {
    fond = `${parts[0]}${parts[1]}`;
    opys = parts[2];
    sprava = parts[3];
  } else {
    return buildUnparsed(trimmed);
  }

  return {
    archive,
    fond: fond.trim(),
    opys: opys.trim(),
    sprava: sprava.trim(),
    raw: trimmed,
  };
}
