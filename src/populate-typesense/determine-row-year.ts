import { isInteger, last, toNumber, toString } from 'lodash';

import type { IndexationTable } from '@/shared/schemas/indexation-table';

export default function determineRowYear(
  row: Record<string, unknown>,
  table: IndexationTable,
): number {
  let result;
  const yearInRow =
    row['Рік'] ||
    row['Год'] ||
    row['Рік сповідки'] ||
    row['рік життя'] ||
    row['рік смерті'] ||
    row['рік народження'] ||
    row['Рік народження'] ||
    row['Рік одруження'] ||
    row['Рік смерті'];
  if (yearInRow) {
    if (yearInRow === '') {
      return 0;
    }
    result = toNumber(yearInRow);
  }
  if (!result) {
    const dateInRow =
      row['Дата події'] ||
      row['Дата'] ||
      row['Дата народження'] ||
      row['Дата одруження'] ||
      row['Дата шлюбу'] ||
      row['Дата смерті'] ||
      row['дата крещ'] ||
      row['Начато'] ||
      row['Окончено'];
    if (dateInRow) {
      if (dateInRow === '?') {
        return 0;
      }
      // console.log(dateInRow);
      const dateInRowAsString = toString(dateInRow);
      if (dateInRowAsString.includes('.')) {
        result = toNumber(last(dateInRowAsString.split('.')));
      } else if (dateInRowAsString.includes('/')) {
        result = toNumber(last(dateInRowAsString.split('/')));
      } else if (dateInRowAsString.includes('-')) {
        result = toNumber(last(dateInRowAsString.split('-')));
      } else {
        const dateInRowAsNumber = Number.parseInt(dateInRowAsString);
        if (Number.isNaN(dateInRowAsNumber)) {
          if (dateInRowAsString.includes('?')) {
            result = 0;
          } else {
            console.warn('Wrong date format');
          }
        } else {
          result = dateInRowAsNumber;
        }
      }
    }
  }
  if (!result && table.yearsRange.length === 1) {
    result = table.yearsRange[0];
  }
  // console.log(result);
  if (!result) {
    console.log(row);
    console.warn('Failed to determine the year.');
    return 0;
    // throw new Error('Failed to determine the year.');
  }
  if (!isInteger(result)) {
    console.warn(`Year is not an integer: ${result} (${typeof result})`);
    return 0;
  }
  if (result < 0) {
    console.warn(`Year is negative: ${result}`);
    return 0;
  }
  if (result > 9999) {
    console.warn(`Year is too large: ${result}`);
    return 0;
  }
  if (result < 1500 && result !== 0) {
    console.warn(
      `Year is too small: ${result}. It should be greater than 1500.`,
    );
    return 0;
  }
  return result || 0;
}
