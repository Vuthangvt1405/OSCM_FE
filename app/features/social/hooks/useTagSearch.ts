"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTags, TagResponse } from "@/lib/apis/social";

export interface TagOption {
  id: string;
  name: string;
}

interface UseTagSearchOptions {
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Page size when searching (default: 10) */
  pageSize?: number;
}

interface UseTagSearchReturn {
  /** List of tag suggestions */
  tagSuggestions: TagOption[];
  /** Current search query */
  searchQuery: string;
  /** Set search query (triggers debounced fetch) */
  setSearchQuery: (query: string) => void;
  /** Whether a search is in progress */
  isSearching: boolean;
  /** Clear suggestions */
  clearSuggestions: () => void;
}

/**
 * Custom hook for searching tags
 * Wraps fetchTags API with React state management and debouncing
 */
export function useTagSearch(
  options: UseTagSearchOptions = {},
): UseTagSearchReturn {
  const { debounceMs = 300, pageSize = 10 } = options;

  const [tagSuggestions, setTagSuggestions] = useState<TagOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Convert TagResponse to TagOption
  const mapToOptions = (tags: TagResponse[]): TagOption[] =>
    tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
    }));

  // Load tags based on search query
  const loadTagSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setTagSuggestions([]);
        return;
      }

      setIsSearching(true);

      try {
        const tagsPage = await fetchTags({ search: query, size: pageSize });
        setTagSuggestions(mapToOptions(tagsPage.items));
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        setTagSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [pageSize],
  );

  // Debounced search effect - triggers when searchQuery changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTagSuggestions(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, loadTagSuggestions, debounceMs]);

  return {
    tagSuggestions,
    searchQuery,
    setSearchQuery,
    isSearching,
    clearSuggestions: () => {
      setTagSuggestions([]);
      setSearchQuery("");
    },
  };
}
