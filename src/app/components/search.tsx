"use client";

import _ from "lodash";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import environment from "../../environment";
import search, { type SearchResult } from "../services/search";
import getTypesenseClient from "../services/typesense";

import SearchControls from "./search-controls";
import SearchResults from "./search-results";

import styles from "./search.module.css";


const apiKey = environment.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY;
const host = environment.NEXT_PUBLIC_TYPESENSE_HOST;
const client = getTypesenseClient(apiKey, host);

export default function SearchPage() {
  const [searchHits, setSearchHits] = useState<SearchResult[]>([]);
  const [searchHitsNumber, setSearchHitsNumber] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = useMemo(() => _.debounce(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const [hits, hitsNumber] = await search({
        client,
        // facets,
        query: query,
        // ranges,
      });
      setSearchHits(hits);
      setSearchHitsNumber(hitsNumber);
    } catch (err) {
      setError("Під час пошуку сталася помилка. Будь ласка, спробуйте ще.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, 1000), []);


  const handleInput = useCallback(
    (value: string) => {
      router.replace(
        `/?query=${encodeURIComponent(value)}`,
      );
    },
    [router]
  );

  useEffect(() => {
    searchQuery(searchParams.get("query") || "");
  }, [searchParams, searchQuery]);

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Пошук</h2>
      <SearchControls
        query={searchParams.get("query") || ""}
        // areRefinementsExpanded={areRefinementsExpanded}
        client={client}
        // onFacetChange={(event) => handleFacetChange(event.detail)}
        // onRangeChange={(event) => handleRangeChange(event.detail)}
        // onToggleRefinementsExpanded={toggleRefinementsExpanded}
        onInput={(event) => handleInput(event.detail)}
      />

      {error && (
        <p className={styles.errorMessage} aria-live="assertive">
          {error}
        </p>
      )}

      <SearchResults
        loading={loading}
        results={searchHits}
        resultsNumber={searchHitsNumber}
      />
    </section>
  );
}