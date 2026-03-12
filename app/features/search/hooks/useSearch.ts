/**
 * Unified Search Hook
 *
 * Provides search functionality across all entity types with:
 * - Debounced input
 * - React Query caching
 * - Tab-based filtering
 * - Parallel API execution
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAll, searchByType } from "@/lib/apis/search";
import type {
  SearchEntityType,
  UnifiedSearchResponse,
  SearchConfig,
} from "../types/unified-search";
import { DEFAULT_SEARCH_CONFIG } from "../types/unified-search";

interface UseSearchOptions {
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Number of results to fetch per type in dropdown mode */
  dropdownSize?: number;
  /** Number of results per page on full search page */
  pageSize?: number;
  /** Whether to enable caching */
  enableCache?: boolean;
}

interface UseSearchReturn {
  /** Current search query */
  query: string;
  /** Set search query (triggers debounced fetch) */
  setQuery: (query: string) => void;
  /** Active tab for filtering */
  activeTab: SearchEntityType;
  /** Set active tab */
  setActiveTab: (tab: SearchEntityType) => void;
  /** Search results */
  results: UnifiedSearchResponse | undefined;
  /** Whether search is in progress */
  isSearching: boolean;
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Whether there are any results */
  hasResults: boolean;
  /** Total result count across all types */
  totalCount: number;
  /** Counts for each entity type */
  counts: {
    users: number;
    posts: number;
    topics: number;
    tags: number;
  };
  /** Clear search */
  clearSearch: () => void;
  /** Submit search */
  submitSearch: () => void;
}

/**
 * Custom hook for unified search
 * Provides debounced search with React Query caching
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = DEFAULT_SEARCH_CONFIG.debounceMs,
    dropdownSize = DEFAULT_SEARCH_CONFIG.dropdownSize,
    pageSize = DEFAULT_SEARCH_CONFIG.pageSize,
    enableCache = true,
  } = options;

  // State
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchEntityType>("all");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Use submitted query for actual search (separates typing from searching)
  const searchQuery = submittedQuery || debouncedQuery;
  const isInitialLoad = submittedQuery === "" && debouncedQuery !== "";

  // Determine if we're in dropdown mode (quick search) or full page mode
  const isDropdownMode = submittedQuery === "";

  // Query key for React Query - includes all dependencies
  const queryKey = useMemo(
    () => ["search", activeTab, searchQuery, dropdownSize, pageSize] as const,
    [activeTab, searchQuery, dropdownSize, pageSize],
  );

  // Fetch function
  const fetchResults = useCallback(async () => {
    if (!searchQuery.trim()) {
      return {
        users: [],
        topics: [],
        posts: [],
        tags: [],
      };
    }

    if (activeTab === "all") {
      // Search all types in parallel
      return searchAll(searchQuery, dropdownSize);
    } else {
      // Search specific type
      const result = await searchByType(activeTab, searchQuery, 0, pageSize);

      return {
        users: activeTab === "users" ? (result.items as never[]) : [],
        topics: activeTab === "topics" ? (result.items as never[]) : [],
        posts: activeTab === "posts" ? (result.items as never[]) : [],
        tags: activeTab === "tags" ? (result.items as never[]) : [],
      };
    }
  }, [searchQuery, activeTab, dropdownSize, pageSize]);

  // React Query hook
  const {
    data: results,
    isLoading: isQueryLoading,
    error,
    isPlaceholderData,
  } = useQuery({
    queryKey,
    queryFn: fetchResults,
    enabled: searchQuery.length > 0,
    staleTime: enableCache ? DEFAULT_SEARCH_CONFIG.cacheTime : 0,
    gcTime: enableCache ? DEFAULT_SEARCH_CONFIG.cacheTime * 2 : 0,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Computed values
  const counts = useMemo(
    () => ({
      users: results?.users.length ?? 0,
      posts: results?.posts.length ?? 0,
      topics: results?.topics.length ?? 0,
      tags: results?.tags.length ?? 0,
    }),
    [results],
  );

  const totalCount = useMemo(
    () => counts.users + counts.posts + counts.topics + counts.tags,
    [counts],
  );

  const hasResults = totalCount > 0;

  // Handlers
  const clearSearch = useCallback(() => {
    setQuery("");
    setSubmittedQuery("");
    setDebouncedQuery("");
  }, []);

  const submitSearch = useCallback(() => {
    if (query.trim()) {
      setSubmittedQuery(query);
    }
  }, [query]);

  return {
    query,
    setQuery,
    activeTab,
    setActiveTab,
    results,
    isSearching: isQueryLoading,
    isLoading: isInitialLoad && isQueryLoading,
    error: error as Error | null,
    hasResults,
    totalCount,
    counts,
    clearSearch,
    submitSearch,
  };
}

/**
 * Hook for dropdown search (quick search mode)
 * Simpler version for search bar dropdown
 */
export function useSearchDropdown(
  options: { debounceMs?: number; size?: number } = {},
) {
  const { debounceMs = 300, size = 3 } = options;

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Debounce
  useEffect(() => {
    if (!query.trim()) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["search-dropdown", query, size],
    queryFn: () => searchAll(query, size),
    enabled: query.length > 0 && isOpen,
    staleTime: 60000, // 1 minute cache for dropdown
    refetchOnWindowFocus: false,
  });

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openDropdown = useCallback(() => {
    if (query.trim()) {
      setIsOpen(true);
    }
  }, [query]);

  return {
    query,
    setQuery,
    results: data,
    isLoading,
    error,
    isOpen,
    closeDropdown,
    openDropdown,
    hasResults: data
      ? data.users.length > 0 ||
        data.topics.length > 0 ||
        data.posts.length > 0 ||
        data.tags.length > 0
      : false,
  };
}
