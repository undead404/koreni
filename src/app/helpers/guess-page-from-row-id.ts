import { PER_PAGE } from "../constants";

export default function guessPageFromRowId(rowId: string): number {
  const [, rowNumber] = rowId.split("-");
  return Math.ceil(Number.parseInt(rowNumber) / PER_PAGE);
}
