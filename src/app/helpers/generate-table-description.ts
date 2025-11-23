import { IndexationTable } from '@/shared/schemas/indexation-table';

/*
type IndexationTable = {
    date: Date;
    id: string;
    tableFilename: string;
    location: [number, number];
    size: number;
    sources: string[];
    title: string;
    tableLocale: "pl" | "ru" | "uk";
    yearsRange: number[];
    archiveItems?: string[] | undefined;
    author?: string | undefined;
}
    */

export default function generateTableDescription(
  tableMetadata: IndexationTable,
): string {
  let description = `${tableMetadata.size} записів`;
  switch (tableMetadata.tableLocale) {
    case 'uk': {
      description += ' українською мовою';
      break;
    }
    case 'ru': {
      description += ' російською мовою';
      break;
    }
    case 'pl': {
      description += ' польською мовою';
      break;
    }
    default: {
      throw new Error(
        `Unknown table locale for table ${tableMetadata.id}: ${tableMetadata.tableLocale as string}`,
      );
    }
  }
  if (tableMetadata.yearsRange.length === 1) {
    description += ` за ${tableMetadata.yearsRange[0]} рік`;
  } else if (tableMetadata.yearsRange.length === 2) {
    description += ` за ${tableMetadata.yearsRange[0]}–${tableMetadata.yearsRange[1]} роки`;
  }
  description += `, проіндексованих ${tableMetadata.date.toLocaleDateString(
    'uk-UA',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  )}`;
  if (description.length < 50 || description.length > 5000) {
    throw new Error(
      `Invalid description length for table ${tableMetadata.id} – "${description}": ${description.length}`,
    );
  }
  return description;
}
