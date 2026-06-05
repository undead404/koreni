export type ColumnExpectedType = 'string' | 'number';

export interface ColumnConfig {
  id: string;
  title: string;
  hint: string;
  expectedType: ColumnExpectedType;
  isExtended?: boolean;
}
