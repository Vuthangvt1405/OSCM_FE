/**
 * Search Bar Component
 *
 * Unified search bar with dropdown results.
 * Combines SearchInput and SearchDropdown.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchAll } from "@/lib/apis/search";
import { SearchInput } from "./SearchInput";
import { SearchDropdown } from "./SearchDropdown";
import type { UnifiedSearchResponse } from "../types/unified-search";

interface SearchBarProps {
  /** Placeholder text */
  placeholder?: string;
  /** Whether search is in compact mode (for header) */
  compact?: boolean;
  /** Callback when search is submitted */
  onSearch?: (query: string) => void;
}

/**
 * Main search bar component with dropdown
 */
export function SearchBar({
  placeholder = "Search users, posts, topics, tags...",
  compact = false,
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnifiedSearchResponse | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults(undefined);
      setIsOpen(false);
      return;
    }

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchAll(query, compact ? 2 : 3);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, compact]);

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      setIsOpen(false);
      onSearch?.(query);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }, [query, onSearch, router]);

  const handleFocus = useCallback(() => {
    if (query.trim() && results) {
      setIsOpen(true);
    }
  }, [query, results]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className="relative w-full">
      <SearchInput
        value={query}
        onChange={(value) => setQuery(value)}
        onSubmit={handleSubmit}
        placeholder={placeholder}
        isLoading={isLoading}
      />

      {/* Dropdown */}
      {isOpen && query.trim() && (
        <SearchDropdown
          results={results}
          isLoading={isLoading}
          isOpen={isOpen}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

/**
 * Compact search bar for header/navigation
 */
export function SearchBarCompact({
  placeholder = "Search...",
}: Omit<SearchBarProps, "compact">) {
  return <SearchBar placeholder={placeholder} compact />;
}
