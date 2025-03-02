"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { z } from "zod";
import _ from "lodash";
import environment from "../../environment";
import { nonEmptyString } from "@/shared/schemas/non-empty-string"
import search, { type SearchResult } from "../services/search";
import getTypesenseClient from "../services/typesense";

import SearchControls from "./search-controls";
import SearchResults from "./search-results";

const facetEventDetailSchema = z.object({
  attribute: nonEmptyString,
  values: z.array(nonEmptyString),
});
const rangeEventDetailSchema = z.object({
  attribute: nonEmptyString,
  values: z.tuple([z.number(), z.number()]),
});
const { debounce } = _;

const apiKey = environment.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY;
const host = environment.NEXT_PUBLIC_TYPESENSE_HOST;
const client = getTypesenseClient(apiKey, host);

export default function SearchPage() {

  const [query, setQuery] = useState("");
  const [searchHits, setSearchHits] = useState<SearchResult[]>([]);
  const [searchHitsNumber, setSearchHitsNumber] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facets, setFacets] = useState<Record<string, string[]>>({});
  const [ranges, setRanges] = useState<Record<string, [number, number]>>({});
  const [areRefinementsExpanded, setAreRefinementsExpanded] = useState(false);


  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    Object.entries(facets).forEach(([key, values]) => {
      if (values.length) params.set(`facet_${key}`, values.join(","));
    });
    Object.entries(ranges).forEach(([key, [min, max]]) => {
      params.set(`range_${key}`, `${min},${max}`);
    });
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [facets, query, ranges]);

  const handleSearch = useMemo(() =>
    debounce(async () => {
      setLoading(true);
      setError(null);
      try {
        const [hits, hitsNumber] = await search({
          client,
          facets,
          query,
          ranges,
        });
        setSearchHits(hits);
        setSearchHitsNumber(hitsNumber);
        updateURL();
      } catch (err) {
        setError("Під час пошуку сталася помилка. Будь ласка, спробуйте ще.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300),
    [facets, query, ranges, updateURL]
  );

  const handleFacetChange = useCallback((detail: typeof facetEventDetailSchema["_type"]) => {
    setFacets((prevFacets) => ({
      ...prevFacets,
      [detail.attribute]: detail.values,
    }));
    handleSearch();
  }, [handleSearch]);

  const handleRangeChange = useCallback((detail: typeof rangeEventDetailSchema["_type"]) => {
    setRanges((prevRanges) => ({
      ...prevRanges,
      [detail.attribute]: detail.values,
    }));
    handleSearch();
  }, [handleSearch]);

  const toggleRefinementsExpanded = useCallback(() => {
    setAreRefinementsExpanded((prev) => !prev);
  }, []);

  const handleInput = useCallback((value: string) => {
    setQuery(value);
    handleSearch();
  }, [handleSearch]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setQuery(urlParams.get("query") || "");

    urlParams.forEach((value, key) => {
      if (key.startsWith("facet_")) {
        const attribute = key.replace("facet_", "");
        setFacets((prevFacets) => ({
          ...prevFacets,
          [attribute]: value.split(","),
        }));
      } else if (key.startsWith("range_")) {
        const attribute = key.replace("range_", "");
        const [min, max] = value.split(",").map(Number);
        if (isNaN(min) || isNaN(max)) {
          console.error("Invalid range values: ", min, max);
          return;
        }
        setRanges((prevRanges) => ({
          ...prevRanges,
          [attribute]: [min, max],
        }));
      }
    });

    handleSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  

  return (
    <section>
      <h2>Пошук</h2>
      <SearchControls
        query={query}
        areRefinementsExpanded={areRefinementsExpanded}
        client={client}
        onFacetChange={(event) => handleFacetChange(event.detail)}
        onRangeChange={(event) => handleRangeChange(event.detail)}
        onToggleRefinementsExpanded={toggleRefinementsExpanded}
        onInput={(event) => handleInput(event.detail)}
      />

      {error && (
        <p className="error-message" aria-live="assertive">
          {error}
        </p>
      )}

      <SearchResults loading={loading} results={searchHits} resultsNumber={searchHitsNumber} />

      <style jsx>{`
        .error-message {
          color: red;
          font-weight: bold;
          margin-top: 1rem;
        }
      `}</style>
    </section>
  );
}