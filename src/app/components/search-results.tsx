import type { FC } from "react";
import { z } from "zod";

import { nonEmptyString } from "@/shared/schemas/non-empty-string";

import type { SearchResult } from "../services/search";

import styles from "./search-results.module.css";
import guessPageFromRowId from "../helpers/guess-page-from-row-id";

interface ResultsProps {
  loading: boolean;
  results: SearchResult[];
  resultsNumber: number;
}

const highlightSchema = z.object({
  data: z
    .record(
      z.object({
        snippet: z.string(),
        matched_tokens: z.array(z.string()),
      })
    )
    .optional(),
});

const resultSchema = z.object({
  document: z.object({
    id: nonEmptyString,
    tableId: z.number(),
    title: nonEmptyString,
  }),
  highlight: highlightSchema,
});

const SearchResults: FC<ResultsProps> = ({
  loading,
  results,
  resultsNumber,
}) => {
  return (
    <table className={styles.table} style={{ opacity: loading ? 0.5 : 1 }}>
      <caption className={styles.caption}>
        Знайдено результатів: {resultsNumber}
      </caption>
      {results.map((result, index) => {
        const typedResult = resultSchema.parse(result);
        return (
          <tbody key={index} className={styles.tbody}>
            {typedResult.highlight.data &&
              Object.entries(typedResult.highlight.data).map(([key, value]) => (
                <tr key={key}>
                  <th scope="row">{key}</th>
                  <td
                    dangerouslySetInnerHTML={{
                      __html: value.snippet,
                    }}
                  ></td>
                  <td>
                    <a
                      className={styles.link}
                      href={`/${
                        typedResult.document.tableId
                      }/${guessPageFromRowId(
                        typedResult.document.id
                      )}?matched_tokens=${value.matched_tokens.join(
                        ","
                      )}&show_row=${typedResult.document.id}`}
                    >
                      {typedResult.document.title}
                    </a>
                  </td>
                </tr>
              ))}
          </tbody>
        );
      })}
    </table>
  );
};

export default SearchResults;
