import type { IndexationTable } from '@/shared/schemas/indexation-table';

const LOCALE_DESCRIPTIONS: Record<string, string> = {
  pl: ' польською мовою',
  ru: ' російською мовою',
  uk: ' українською мовою',
};

export default function generateTableDescription(
  tableMetadata: IndexationTable,
): string {
  let description = `${tableMetadata.size} записів`;

  const localeDescription = LOCALE_DESCRIPTIONS[tableMetadata.tableLocale];
  if (!localeDescription) {
    throw new Error(
      `Unknown table locale for table ${tableMetadata.id}: ${tableMetadata.tableLocale as string}`,
    );
  }
  description += localeDescription;

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
