export type ColumnExpectedType = 'date' | 'string' | 'number';

export interface ColumnConfig {
  id: string;
  title: string;
  hint?: string;
  expectedType: ColumnExpectedType;
  isExtended?: boolean;
}
