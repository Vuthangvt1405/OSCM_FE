/**
 * Unified Search Feature - Public API
 *
 * Exports all search-related components, hooks, and types.
 */

// Types
export * from "./types/unified-search";

// Hooks
export { useSearch, useSearchDropdown } from "./hooks/useSearch";

// Components
export { SearchInput } from "./components/SearchInput";
export { TabFilter, TabFilterCompact } from "./components/TabFilter";
export { SearchDropdown } from "./components/SearchDropdown";
export { SearchBar, SearchBarCompact } from "./components/SearchBar";
