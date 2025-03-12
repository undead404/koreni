import { PER_PAGE } from '../constants';

export default function guessPageFromRowId(rowId: string): number {
  const idPieces = rowId.split('-');
  const rowNumber = idPieces.at(-1);
  if (!rowNumber) {
    throw new Error('Empty row id');
  }
  const result = Math.ceil(Number.parseInt(rowNumber) / PER_PAGE);
  if (Number.isNaN(result)) {
    throw new TypeError('Failed to determine page from row id ' + rowId);
  }
  return result;
}
