import type { FC } from "react";
import { z } from 'zod';

import { nonEmptyString } from "@/shared/schemas/non-empty-string";

import type { SearchResult } from "../services/search";

interface ResultsProps {
  loading: boolean;
  results: SearchResult[];
  resultsNumber: number;
}

const highlightSchema = z.object({
  data: z.record(
    z.object({
      snippet: z.string(),
      matched_tokens: z.array(z.string()),
    })
  ).optional(),
});

const resultSchema = z.object({
    document: z.object({
        tableFilename: nonEmptyString,
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
    <table style={{ opacity: loading ? 0.5 : 1, width: "100%" }}>
      <caption>Знайдено результатів: {resultsNumber}</caption>
      {results.map((result, index) => {
        const typedResult = resultSchema.parse(result);
        return <tbody key={index}>
          {typedResult.highlight.data &&
            Object.entries(typedResult.highlight.data).map(
              ([key, value]) => (
                <tr key={key}>
                  <th scope="row">{key}</th>
                  <td
                    dangerouslySetInnerHTML={{
                      __html: value.snippet,
                    }}
                  ></td>
                  <td>
                    <a
                      href={`/${
                        typedResult.document.tableFilename
                      }?matched_tokens=${value.matched_tokens.join(",")}`}
                    >
                      {typedResult.document.title}
                    </a>
                  </td>
                </tr>
              )
            )}
        </tbody> // Adjust based on actual SearchResult structure
      })}
    </table>
  );
};

export default SearchResults;
