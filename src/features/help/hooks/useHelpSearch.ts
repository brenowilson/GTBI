import { useState, useMemo, useEffect, useRef } from "react";
import { allArticles, type HelpArticle } from "../articles";

interface UseHelpSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: HelpArticle[];
  isSearching: boolean;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function searchArticles(query: string): HelpArticle[] {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = normalizeText(query);
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  const scored = allArticles.map((article) => {
    const normalizedTitle = normalizeText(article.title);
    const normalizedContent = normalizeText(article.content);
    const normalizedTags = article.tags.map(normalizeText);
    const normalizedCategory = normalizeText(article.categoryLabel);

    let score = 0;

    for (const term of queryTerms) {
      // Title match (highest weight)
      if (normalizedTitle.includes(term)) {
        score += 10;
      }

      // Tag match (high weight)
      if (normalizedTags.some((tag) => tag.includes(term))) {
        score += 7;
      }

      // Category match (medium weight)
      if (normalizedCategory.includes(term)) {
        score += 5;
      }

      // Content match (lower weight)
      if (normalizedContent.includes(term)) {
        score += 3;
      }
    }

    return { article, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.article);
}

export function useHelpSearch(): UseHelpSearchResult {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setIsSearching(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const results = useMemo(
    () => searchArticles(debouncedQuery),
    [debouncedQuery]
  );

  return {
    query,
    setQuery,
    results,
    isSearching,
  };
}
