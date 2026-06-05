import type { ColumnConfig } from '../workspace/_helpers/column-config';

const CONFESSION_LIST_COLUMNS: ColumnConfig[] = [
  {
    id: 'HH',
    title: '#HH',
    hint: 'Number of household',
    expectedType: 'number',
  },
  { id: 'M', title: '#M', hint: 'Number of male', expectedType: 'number' },
  { id: 'F', title: '#F', hint: 'Number of female', expectedType: 'number' },
  {
    id: 'Name',
    title: 'Name',
    hint: '',
    expectedType: 'string',
    isExtended: true,
  },
  { id: 'aM', title: 'aM', hint: 'Age of male', expectedType: 'string' },
  { id: 'aF', title: 'aF', hint: 'Age of female', expectedType: 'string' },
  {
    id: 'Note',
    title: 'Note',
    hint: 'Anything to the right of the age',
    expectedType: 'string',
    isExtended: true,
  },
];

const SCHEMA_COLUMNS: Partial<Record<string, ColumnConfig[]>> = {
  'confession-list': CONFESSION_LIST_COLUMNS,
};

export function getColumnsBySchemaValue(value: string): ColumnConfig[] {
  const columns = SCHEMA_COLUMNS[value];
  if (!columns) {
    throw new TypeError(`Unknown schema: ${value}`);
  }
  return columns;
}

const getProjectSchemas = async () => {
  await Promise.resolve();
  return [
    {
      enabled: true,
      label: 'Late russian confession list',
      value: 'confession-list',
    },
    {
      enabled: false,
      label: 'Late russian parish register',
      value: 'parish-register',
    },
  ];
};
export default getProjectSchemas;
