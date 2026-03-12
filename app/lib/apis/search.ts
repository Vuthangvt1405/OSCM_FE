/**
 * Unified Search API
 *
 * Provides a unified interface for searching across all entity types:
 * users, posts, topics, and tags.
 *
 * Uses Promise.allSettled for parallel execution with graceful degradation.
 */

import type {
  UnifiedSearchResponse,
  UserSearchItem,
  TopicSearchItem,
  PostSearchItem,
  TagSearchItem,
} from "@/features/search/types/unified-search";

/** Backend base URL - uses Next.js API routes */
const API_BASE = "";

/** Default size for dropdown preview results */
const DEFAULT_DROPDOWN_SIZE = 3;

/** Default size for full page results */
const DEFAULT_PAGE_SIZE = 20;

/**
 * User search response types
 */
export type UsersPage = {
  items: UserSearchItem[];
  page: number;
  hasNext: boolean;
};

/**
 * Parse user search response from backend
 */
function parseUserResponse(payload: unknown): UserSearchItem[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item): UserSearchItem | null => {
      if (typeof item !== "object" || item === null) return null;

      const record = item as Record<string, unknown>;
      const userId = typeof record.userId === "string" ? record.userId : null;
      const username =
        typeof record.username === "string" ? record.username : null;
      const displayName =
        typeof record.displayName === "string" ? record.displayName : "";
      const avatarUrl =
        typeof record.avatarUrl === "string" ? record.avatarUrl : null;

      if (!userId || !username) return null;

      return { userId, username, displayName, avatarUrl };
    })
    .filter((u): u is UserSearchItem => u !== null);
}

/**
 * Fetch users by search query
 */
async function fetchUsers(
  query: string,
  size: number = DEFAULT_DROPDOWN_SIZE,
): Promise<UserSearchItem[]> {
  const url = `/api/social/users/search?q=${encodeURIComponent(query)}&size=${size}`;

  const res = await fetch(url);

  if (!res.ok) {
    console.warn("[SearchAPI] User search failed:", res.status);
    return [];
  }

  const payload = await res.json().catch(() => null);
  return parseUserResponse(payload);
}

/**
 * Fetch topics by search query
 */
async function fetchTopics(
  query: string,
  size: number = DEFAULT_DROPDOWN_SIZE,
): Promise<TopicSearchItem[]> {
  const url = `/api/social/topics/search?query=${encodeURIComponent(query)}&size=${size}`;

  const res = await fetch(url);

  if (!res.ok) {
    console.warn("[SearchAPI] Topic search failed:", res.status);
    return [];
  }

  const payload = await res.json().catch(() => null);

  if (!Array.isArray(payload)) return [];

  return payload
    .map((item): TopicSearchItem | null => {
      if (typeof item !== "object" || item === null) return null;

      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : null;
      const name = typeof record.name === "string" ? record.name : null;
      const description =
        typeof record.description === "string" ? record.description : "";
      const membersCount =
        typeof record.membersCount === "number" ? record.membersCount : 0;
      const postCount =
        typeof record.postCount === "number" ? record.postCount : 0;
      const coverImage = typeof record.cover === "string" ? record.cover : null;

      if (!id || !name) return null;

      return { id, name, description, membersCount, postCount, coverImage };
    })
    .filter((t): t is TopicSearchItem => t !== null);
}

/**
 * Fetch posts by search query
 */
async function fetchPosts(
  query: string,
  size: number = DEFAULT_DROPDOWN_SIZE,
): Promise<PostSearchItem[]> {
  const url = `/api/social/posts/search?query=${encodeURIComponent(query)}&size=${size}`;

  const res = await fetch(url);

  if (!res.ok) {
    console.warn("[SearchAPI] Post search failed:", res.status);
    return [];
  }

  const payload = await res.json().catch(() => null);

  if (!Array.isArray(payload)) return [];

  return payload
    .map((item): PostSearchItem | null => {
      if (typeof item !== "object" || item === null) return null;

      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : null;
      const title = typeof record.title === "string" ? record.title : null;

      if (!id || !title) return null;

      const caption = typeof record.caption === "string" ? record.caption : "";
      const cover = typeof record.cover === "string" ? record.cover : null;
      const createdAt =
        typeof record.createdAt === "string" ? record.createdAt : "";
      const likeCount =
        typeof record.likeCount === "number" ? record.likeCount : 0;
      const dislikeCount =
        typeof record.dislikeCount === "number" ? record.dislikeCount : 0;

      // Parse author
      let author: { username: string } | null = null;
      if (typeof record.author === "object" && record.author !== null) {
        const authorRecord = record.author as Record<string, unknown>;
        const username =
          typeof authorRecord.username === "string"
            ? authorRecord.username
            : null;
        if (username) author = { username };
      }

      // Parse topic
      let topic: { id: string; name: string } | null = null;
      if (typeof record.topic === "object" && record.topic !== null) {
        const topicRecord = record.topic as Record<string, unknown>;
        const topicId =
          typeof topicRecord.id === "string" ? topicRecord.id : null;
        const topicName =
          typeof topicRecord.name === "string" ? topicRecord.name : null;
        if (topicId && topicName) topic = { id: topicId, name: topicName };
      }

      // Parse tags
      let tags: string[] = [];
      if (Array.isArray(record.tags)) {
        tags = record.tags.filter((t): t is string => typeof t === "string");
      }

      return {
        id,
        title,
        caption,
        cover,
        author,
        topic,
        tags,
        createdAt,
        likeCount,
        dislikeCount,
      };
    })
    .filter((p): p is PostSearchItem => p !== null);
}

/**
 * Fetch tags by search query
 */
async function fetchTags(
  query: string,
  size: number = DEFAULT_DROPDOWN_SIZE,
): Promise<TagSearchItem[]> {
  const url = `/api/social/tags/search?q=${encodeURIComponent(query)}&size=${size}`;

  const res = await fetch(url);

  if (!res.ok) {
    console.warn("[SearchAPI] Tag search failed:", res.status);
    return [];
  }

  const payload = await res.json().catch(() => null);

  if (!Array.isArray(payload)) return [];

  return payload
    .map((item): TagSearchItem | null => {
      if (typeof item !== "object" || item === null) return null;

      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : null;
      const name = typeof record.name === "string" ? record.name : null;

      if (!id || !name) return null;

      return { id, name };
    })
    .filter((t): t is TagSearchItem => t !== null);
}

/**
 * Search all entity types in parallel
 * Uses Promise.allSettled to handle partial failures gracefully
 */
export async function searchAll(
  query: string,
  size: number = DEFAULT_DROPDOWN_SIZE,
): Promise<UnifiedSearchResponse> {
  const results = await Promise.allSettled([
    fetchUsers(query, size),
    fetchTopics(query, size),
    fetchPosts(query, size),
    fetchTags(query, size),
  ]);

  return {
    users: results[0].status === "fulfilled" ? results[0].value : [],
    topics: results[1].status === "fulfilled" ? results[1].value : [],
    posts: results[2].status === "fulfilled" ? results[2].value : [],
    tags: results[3].status === "fulfilled" ? results[3].value : [],
  };
}

/**
 * Search a specific entity type
 */
export async function searchByType(
  type: "users" | "posts" | "topics" | "tags",
  query: string,
  page: number = 0,
  size: number = DEFAULT_PAGE_SIZE,
): Promise<{
  items:
    | UserSearchItem[]
    | TopicSearchItem[]
    | PostSearchItem[]
    | TagSearchItem[];
  page: number;
  hasNext: boolean;
}> {
  switch (type) {
    case "users": {
      const url = `/api/social/users/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`;
      const res = await fetch(url);
      const payload = await res.json().catch(() => null);
      return { items: parseUserResponse(payload), page, hasNext: false };
    }
    case "topics": {
      const url = `/api/social/topics/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`;
      const res = await fetch(url);
      const payload = await res.json().catch(() => null);
      const items = Array.isArray(payload) ? payload : [];
      return { items, page, hasNext: false };
    }
    case "posts": {
      const url = `/api/social/posts/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`;
      const res = await fetch(url);
      const payload = await res.json().catch(() => null);
      return {
        items: Array.isArray(payload) ? payload : [],
        page,
        hasNext: false,
      };
    }
    case "tags": {
      const url = `/api/social/tags/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`;
      const res = await fetch(url);
      const payload = await res.json().catch(() => null);
      return {
        items: Array.isArray(payload) ? payload : [],
        page,
        hasNext: false,
      };
    }
  }
}

/**
 * Get total count of results across all types
 */
export function getTotalCount(response: UnifiedSearchResponse): number {
  return (
    response.users.length +
    response.topics.length +
    response.posts.length +
    response.tags.length
  );
}

/**
 * Check if there are any results
 */
export function hasResults(response: UnifiedSearchResponse): boolean {
  return getTotalCount(response) > 0;
}
