/**
 * Unified Search Type Definitions
 *
 * Provides consistent types for the unified search feature across
 * users, posts, topics, and tags.
 */

/** Supported search entity types */
export type SearchEntityType = "all" | "users" | "posts" | "topics" | "tags";

/** Tab configuration for search */
export interface SearchTab {
  id: SearchEntityType;
  label: string;
  icon: string;
  count?: number;
  isDisabled?: boolean;
}

/** User search result item */
export interface UserSearchItem {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

/** Topic search result item */
export interface TopicSearchItem {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  postCount: number;
  coverImage?: string | null;
}

/** Tag search result item */
export interface TagSearchItem {
  id: string;
  name: string;
  postCount?: number;
}

/** Post search result item */
export interface PostSearchItem {
  id: string;
  title: string;
  caption: string;
  cover: string | null;
  author: {
    username: string;
  } | null;
  topic: {
    id: string;
    name: string;
  } | null;
  tags: string[];
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
  commentCount?: number;
  viewCount?: number;
  myReaction?: string | null;
}

/** Unified search response containing all entity types */
export interface UnifiedSearchResponse {
  users: UserSearchItem[];
  topics: TopicSearchItem[];
  posts: PostSearchItem[];
  tags: TagSearchItem[];
}

/** Search counts for each entity type */
export interface SearchCounts {
  users: number;
  posts: number;
  topics: number;
  tags: number;
}

/** Search state for the UI */
export interface SearchState {
  query: string;
  activeTab: SearchEntityType;
  isDropdownOpen: boolean;
}

/** Search result item that can be rendered generically */
export interface SearchResultGeneric {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  image?: string | null;
  metadata?: Record<string, unknown>;
}

/** Pagination state for search results */
export interface SearchPaginationState {
  page: number;
  hasNext: boolean;
  isLoadingMore: boolean;
}

/** Configuration for search behavior */
export interface SearchConfig {
  /** Debounce delay in milliseconds */
  debounceMs: number;
  /** Number of results to show in dropdown per type */
  dropdownSize: number;
  /** Number of results per page on full search page */
  pageSize: number;
  /** Whether to enable caching */
  enableCache: boolean;
  /** Cache time in milliseconds */
  cacheTime: number;
}

/** Default search configuration */
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  debounceMs: 300,
  dropdownSize: 3,
  pageSize: 20,
  enableCache: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
};

/** Tab definitions for search */
export const SEARCH_TABS: SearchTab[] = [
  { id: "all", label: "All", icon: "🔍" },
  { id: "users", label: "Users", icon: "👤" },
  { id: "posts", label: "Posts", icon: "📝" },
  { id: "topics", label: "Topics", icon: "📁" },
  { id: "tags", label: "Tags", icon: "🏷️" },
];
