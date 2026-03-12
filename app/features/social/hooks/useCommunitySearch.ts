"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTopics, TopicResponse } from "@/lib/apis/social";

export interface CommunityOption {
  id: string;
  name: string;
}

interface UseCommunitySearchOptions {
  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number;
  /** Page size for initial load (default: 10) */
  initialPageSize?: number;
  /** Page size when searching (default: 20) */
  searchPageSize?: number;
}

interface UseCommunitySearchReturn {
  /** List of community options */
  communities: CommunityOption[];
  /** Current search query */
  searchQuery: string;
  /** Set search query (triggers debounced fetch) */
  setSearchQuery: (query: string) => void;
  /** Whether a search is in progress */
  isSearching: boolean;
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Manually reload communities */
  reload: () => void;
}

/**
 * Custom hook for searching and managing community/topic options
 * Wraps fetchTopics API with React state management and debouncing
 */
export function useCommunitySearch(
  options: UseCommunitySearchOptions = {},
): UseCommunitySearchReturn {
  const {
    debounceMs = 500,
    initialPageSize = 10,
    searchPageSize = 20,
  } = options;

  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Convert TopicResponse to CommunityOption
  const mapToOptions = (topics: TopicResponse[]): CommunityOption[] =>
    topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
    }));

  // Load communities based on search query
  const loadCommunities = useCallback(
    async (query: string) => {
      const hasSearch = query.trim().length > 0;

      if (hasSearch) {
        setIsSearching(true);
      } else {
        setIsLoading(true);
      }

      try {
        // Use different page sizes based on search mode
        const params = hasSearch
          ? { search: query, size: searchPageSize }
          : { page: 0, size: initialPageSize };

        const topicsPage = await fetchTopics(params);
        setCommunities(mapToOptions(topicsPage.items));
      } catch (error) {
        console.error("Failed to fetch communities:", error);
        // Keep empty communities on error - UI will show "No communities found"
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    },
    [initialPageSize, searchPageSize],
  );

  // Initial load on mount
  useEffect(() => {
    loadCommunities("");
  }, [loadCommunities]);

  // Debounced search effect - triggers when searchQuery changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCommunities(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, loadCommunities, debounceMs]);

  return {
    communities,
    searchQuery,
    setSearchQuery,
    isSearching,
    isLoading,
    reload: () => loadCommunities(searchQuery),
  };
}
