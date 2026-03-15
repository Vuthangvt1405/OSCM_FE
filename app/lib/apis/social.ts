import type { PostDetailResponse, PostDetailAuthor } from "@/lib/social/types";
import { getJson, postJson } from "./http";

type ErrorShape = {
  message?: string;
  status?: number;
  timestamp?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload == "string") return payload || fallback;
  if (isRecord(payload) && typeof payload.message === "string")
    return payload.message || fallback;
  return fallback;
}

export type BackendAuthor = {
  username?: string | null;
};

export type BackendPostFeedItem = {
  id: string;
  title: string;
  caption?: string | null;
  cover?: string | null;
  author?: BackendAuthor | null;
  myReaction?: string | null;
  createdAt?: string | null;
  /** Number of likes on this post */
  likeCount?: number;
  /** Number of dislikes on this post */
  dislikeCount?: number;
};

export type SocialPostsPage = {
  items: BackendPostFeedItem[];
  page: number;
  hasNext: boolean;
};

function parseBackendAuthor(value: unknown): BackendAuthor | null {
  if (!isRecord(value)) return null;
  const username = typeof value.username === "string" ? value.username : null;
  return { username };
}

function parseBackendPostFeedItem(value: unknown): BackendPostFeedItem | null {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "string" ? value.id : null;
  const title = typeof value.title === "string" ? value.title : null;

  if (!id || !title) return null;

  const caption = typeof value.caption === "string" ? value.caption : null;
  const cover = typeof value.cover === "string" ? value.cover : null;
  const createdAt =
    typeof value.createdAt === "string" ? value.createdAt : null;
  const author = parseBackendAuthor(value.author);

  const myReaction =
    typeof value.myReaction === "string" ? value.myReaction : null;

  // Parse reaction counts
  const likeCount = typeof value.likeCount === "number" ? value.likeCount : 0;
  const dislikeCount =
    typeof value.dislikeCount === "number" ? value.dislikeCount : 0;

  return {
    id,
    title,
    caption,
    cover,
    createdAt,
    author,
    myReaction,
    likeCount,
    dislikeCount,
  };
}

function parseItems(payload: unknown): BackendPostFeedItem[] {
  if (!Array.isArray(payload)) return [];

  const items: BackendPostFeedItem[] = [];
  for (const entry of payload) {
    const parsed = parseBackendPostFeedItem(entry);
    if (parsed) items.push(parsed);
  }

  return items;
}

export async function fetchSocialPostsPage({
  page,
  size,
}: {
  page: number;
  size: number;
}): Promise<SocialPostsPage> {
  const res = await fetch(`/api/social/posts?page=${page}&size=${size}`);

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const headerHasNext = res.headers.get("x-has-next") ?? "";
  const headerPage = res.headers.get("x-page");

  const hasNext = headerHasNext.toLowerCase() === "true";
  const resolvedPage = headerPage ? Number(headerPage) : page;

  return {
    items: parseItems(payload),
    page: Number.isFinite(resolvedPage) ? resolvedPage : page,
    hasNext,
  };
}

export type CreatePostRequest = {
  title: string;
  content: string;
  cover?: string;
  caption?: string;
  visibility?: string;
  tags?: string[];
  password?: string;
};

export async function createPost(input: CreatePostRequest): Promise<void> {
  const res = await fetch("/api/social/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;

    try {
      const payload = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      if (
        contentType.includes("application/json") &&
        payload &&
        typeof payload === "object" &&
        "message" in payload
      ) {
        errorMessage =
          (payload as { message?: string }).message || errorMessage;
      } else if (typeof payload === "string" && payload) {
        errorMessage = payload;
      } else if (contentType.includes("application/json")) {
        errorMessage = JSON.stringify(payload);
      }
    } catch {
      // If parsing fails, use the generic error message
    }

    throw new Error(errorMessage);
  }
}

export async function createTopicPost(
  topicId: string,
  input: CreatePostRequest,
): Promise<void> {
  const res = await fetch(`/api/social/topics/${topicId}/posts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;

    try {
      const payload = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      if (contentType.includes("application/json") && payload.message) {
        errorMessage = payload.message;
      } else if (typeof payload === "string" && payload) {
        errorMessage = payload;
      } else if (contentType.includes("application/json")) {
        errorMessage = JSON.stringify(payload);
      }
    } catch (error) {
      // Error parsing response
    }

    throw new Error(errorMessage || "Failed to create topic post");
  }
}

export type TopicResponse = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  membersCount: number;
  postCount: number;
  createdAt: string;
};

export type TopicsPage = {
  items: TopicResponse[];
  page: number;
  hasNext: boolean;
};

function parseTopicResponse(value: unknown): TopicResponse | null {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "string" ? value.id : null;
  const name = typeof value.name === "string" ? value.name : null;
  const description =
    typeof value.description === "string" ? value.description : null;
  const ownerId = typeof value.ownerId === "string" ? value.ownerId : null;

  if (!id || !name || !ownerId) return null;

  const membersCount =
    typeof value.membersCount === "number" ? value.membersCount : 0;
  const postCount = typeof value.postCount === "number" ? value.postCount : 0;
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : "";

  return {
    id,
    name,
    description: description ?? "",
    ownerId,
    membersCount,
    postCount,
    createdAt,
  };
}

function parseTopicsPayload(payload: unknown): TopicResponse[] {
  if (!Array.isArray(payload)) return [];

  const items: TopicResponse[] = [];
  for (const entry of payload) {
    const parsed = parseTopicResponse(entry);
    if (parsed) items.push(parsed);
  }

  return items;
}

export async function fetchTopics({
  page = 0,
  size = 20,
  search,
}: {
  page?: number;
  size?: number;
  search?: string;
} = {}): Promise<TopicsPage> {
  let url = `/api/social/topics?page=${page}&size=${size}`;
  if (search) {
    url += `&q=${encodeURIComponent(search)}`;
  }

  const res = await fetch(url);

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const hasNext =
    isRecord(payload) && typeof payload.hasNext === "boolean"
      ? payload.hasNext
      : false;
  const resolvedPage =
    isRecord(payload) && typeof payload.page === "number" ? payload.page : page;

  return {
    items: parseTopicsPayload(payload),
    page: resolvedPage,
    hasNext,
  };
}

export type TagResponse = {
  id: string;
  name: string;
  createdAt: string;
};

export type TagsPage = {
  items: TagResponse[];
  page: number;
  hasNext: boolean;
};

function parseTagResponse(value: unknown): TagResponse | null {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "string" ? value.id : null;
  const name = typeof value.name === "string" ? value.name : null;
  const createdAt =
    typeof value.createdAt === "string" ? value.createdAt : null;

  if (!id || !name) return null;

  return {
    id,
    name,
    createdAt: createdAt ?? "",
  };
}

function parseTagsPayload(payload: unknown): TagResponse[] {
  if (!Array.isArray(payload)) return [];

  const items: TagResponse[] = [];
  for (const entry of payload) {
    const parsed = parseTagResponse(entry);
    if (parsed) items.push(parsed);
  }

  return items;
}

export async function fetchTags({
  page = 0,
  size = 20,
  search,
}: {
  page?: number;
  size?: number;
  search?: string;
} = {}): Promise<TagsPage> {
  let url = `/api/social/tags?page=${page}&size=${size}`;
  if (search) {
    url += `&q=${encodeURIComponent(search)}`;
  }

  const res = await fetch(url);

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const headerHasNext = res.headers.get("x-has-next") ?? "";
  const headerPage = res.headers.get("x-page");

  const hasNext = headerHasNext.toLowerCase() === "true";
  const resolvedPage = headerPage ? Number(headerPage) : page;

  return {
    items: parseTagsPayload(payload),
    page: Number.isFinite(resolvedPage) ? resolvedPage : page,
    hasNext,
  };
}

export type ToggleReactionType = "LIKE" | "DISLIKE";

export type ReactionCountsResponse = {
  likeCount: number;
  dislikeCount: number;
};

export async function togglePostReaction(
  postId: string,
  type: ToggleReactionType,
): Promise<ReactionCountsResponse> {
  const res = await fetch(`/api/social/posts/${postId}/reactions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type }),
    credentials: "include",
  });

  if (!res.ok) {
    const payload = res.headers
      .get("content-type")
      ?.includes("application/json")
      ? await res.json().catch(() => ({}))
      : {};
    const msg =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : "Request failed";

    throw new Error(msg || "Request failed");
  }

  // Parse the response body for reaction counts
  const payload = await res.json().catch(() => ({}));
  return {
    likeCount: typeof payload.likeCount === "number" ? payload.likeCount : 0,
    dislikeCount:
      typeof payload.dislikeCount === "number" ? payload.dislikeCount : 0,
  };
}

function parsePostDetailResponse(value: unknown): PostDetailResponse | null {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "string" ? value.id : null;
  const title = typeof value.title === "string" ? value.title : null;
  // Content can be null for locked/password-protected posts
  const content = typeof value.content === "string" ? value.content : null;

  // Only id and title are required; content can be null for locked posts
  if (!id || !title) return null;

  const locked = typeof value.locked === "boolean" ? value.locked : false;
  const cover = typeof value.cover === "string" ? value.cover : undefined;
  const caption = typeof value.caption === "string" ? value.caption : undefined;
  const visibility =
    typeof value.visibility === "string" ? value.visibility : "PUBLIC";

  // Parse author - backend returns { authorId, username }
  let author: PostDetailAuthor = { authorId: "", username: "unknown" };
  if (isRecord(value.author)) {
    author = {
      authorId:
        typeof value.author.authorId === "string" ? value.author.authorId : "",
      username:
        typeof value.author.username === "string"
          ? value.author.username
          : "unknown",
    };
  }

  // Parse myReaction
  let myReaction: "LIKE" | "DISLIKE" | null | undefined = undefined;
  if (value.myReaction === "LIKE" || value.myReaction === "DISLIKE") {
    myReaction = value.myReaction;
  }

  // Parse tags
  let tags: string[] = [];
  if (Array.isArray(value.tags)) {
    tags = value.tags.filter((t): t is string => typeof t === "string");
  }

  const createdAt =
    typeof value.createdAt === "string"
      ? value.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof value.updatedAt === "string"
      ? value.updatedAt
      : new Date().toISOString();

  // Parse reaction counts
  const likeCount = typeof value.likeCount === "number" ? value.likeCount : 0;
  const dislikeCount =
    typeof value.dislikeCount === "number" ? value.dislikeCount : 0;

  // Parse topic - backend returns TopicInfoResponse { id, name } or null
  let topic: { id: string; name: string } | null = null;
  if (isRecord(value.topic)) {
    const topicId = typeof value.topic.id === "string" ? value.topic.id : null;
    const topicName =
      typeof value.topic.name === "string" ? value.topic.name : null;
    if (topicId && topicName) {
      topic = { id: topicId, name: topicName };
    }
  }

  return {
    id,
    title,
    content,
    locked,
    cover,
    caption,
    visibility,
    author,
    myReaction,
    tags,
    topic,
    createdAt,
    updatedAt,
    likeCount,
    dislikeCount,
  };
}

export async function fetchPostDetail(
  postId: string,
): Promise<PostDetailResponse> {
  const res = await fetch(`/api/social/posts/${postId}`, {
    method: "GET",
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const parsed = parsePostDetailResponse(payload);
  if (!parsed) {
    throw new Error("Invalid post response format");
  }

  return parsed;
}

/**
 * Generate a URL-friendly slug from post title
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with dashes
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
}

/**
 * Unlock a password-protected post
 * Anyone with the correct password can unlock and view the content
 */
export async function unlockPost(
  postId: string,
  password: string,
): Promise<PostDetailResponse> {
  const res = await fetch(`/api/social/posts/${postId}/unlock`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Unlock failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const parsed = parsePostDetailResponse(payload);
  if (!parsed) {
    throw new Error("Invalid unlock response format");
  }

  return parsed;
}

// ============ User Profile APIs ============

export type UserProfileResponse = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  joinedAt: string | null;
};

export type UserStatsResponse = {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  totalLikes: number;
  totalDislikes: number;
};

function parseUserProfileResponse(value: unknown): UserProfileResponse | null {
  if (!isRecord(value)) return null;

  const userId = typeof value.userId === "string" ? value.userId : null;
  const username = typeof value.username === "string" ? value.username : null;
  const displayName =
    typeof value.displayName === "string" ? value.displayName : null;

  if (!userId || !username || !displayName) return null;

  const avatarUrl =
    typeof value.avatarUrl === "string" ? value.avatarUrl : null;
  const coverUrl = typeof value.coverUrl === "string" ? value.coverUrl : null;
  const bio = typeof value.bio === "string" ? value.bio : null;
  const joinedAt = typeof value.joinedAt === "string" ? value.joinedAt : null;

  return {
    userId,
    username,
    displayName,
    avatarUrl,
    coverUrl,
    bio,
    joinedAt,
  };
}

function parseUserStatsResponse(value: unknown): UserStatsResponse | null {
  if (!isRecord(value)) return null;

  return {
    postsCount: typeof value.postsCount === "number" ? value.postsCount : 0,
    followersCount:
      typeof value.followersCount === "number" ? value.followersCount : 0,
    followingCount:
      typeof value.followingCount === "number" ? value.followingCount : 0,
    totalLikes: typeof value.totalLikes === "number" ? value.totalLikes : 0,
    totalDislikes:
      typeof value.totalDislikes === "number" ? value.totalDislikes : 0,
  };
}

export async function fetchUserProfile(
  userId: string,
): Promise<UserProfileResponse> {
  const res = await fetch(`/api/social/user/${userId}`, {
    method: "GET",
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const parsed = parseUserProfileResponse(payload);
  if (!parsed) {
    throw new Error("Invalid user profile response format");
  }

  return parsed;
}

export async function fetchUserStats(
  userId: string,
): Promise<UserStatsResponse> {
  const res = await fetch(`/api/social/user/${userId}/stats`, {
    method: "GET",
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const parsed = parseUserStatsResponse(payload);
  if (!parsed) {
    throw new Error("Invalid user stats response format");
  }

  return parsed;
}

// ============ User Posts API ============

export type UserPostsPage = {
  items: BackendPostFeedItem[];
  page: number;
  hasNext: boolean;
};

export async function fetchUserPosts({
  userId,
  page = 0,
  size = 10,
}: {
  userId: string;
  page?: number;
  size?: number;
}): Promise<UserPostsPage> {
  const res = await fetch(
    `/api/social/posts/user/${userId}?page=${page}&size=${size}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const headerHasNext = res.headers.get("x-has-next") ?? "";
  const headerPage = res.headers.get("x-page");

  const hasNext = headerHasNext.toLowerCase() === "true";
  const resolvedPage = headerPage ? Number(headerPage) : page;

  return {
    items: parseItems(payload),
    page: Number.isFinite(resolvedPage) ? resolvedPage : page,
    hasNext,
  };
}

// ============ Current User Profile APIs ============

export type CurrentUserResponse = {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  profilePictureUrl: string | null;
  coverPictureUrl: string | null;
  bio: string | null;
  telegramId: string | null;
  joinedAt: string;
};

export type UpdateCurrentUserRequest = {
  email?: string;
  username?: string;
  displayName?: string;
  profilePictureUrl?: string;
  coverPictureUrl?: string;
  bio?: string;
  telegramId?: string;
};

function parseCurrentUserResponse(value: unknown): CurrentUserResponse | null {
  if (!isRecord(value)) return null;

  const userId = typeof value.userId === "string" ? value.userId : null;
  const email = typeof value.email === "string" ? value.email : null;
  const username = typeof value.username === "string" ? value.username : null;
  const displayName =
    typeof value.displayName === "string" ? value.displayName : null;

  if (!userId || !email || !username || !displayName) return null;

  return {
    userId,
    email,
    username,
    displayName,
    profilePictureUrl:
      typeof value.profilePictureUrl === "string"
        ? value.profilePictureUrl
        : null,
    coverPictureUrl:
      typeof value.coverPictureUrl === "string" ? value.coverPictureUrl : null,
    bio: typeof value.bio === "string" ? value.bio : null,
    telegramId: typeof value.telegramId === "string" ? value.telegramId : null,
    joinedAt:
      typeof value.joinedAt === "string"
        ? value.joinedAt
        : new Date().toISOString(),
  };
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const payload = await getJson<unknown>("/api/social/me", {
    credentials: "include",
  });

  const parsed = parseCurrentUserResponse(payload);
  if (!parsed) {
    throw new Error("Invalid current user response format");
  }

  return parsed;
}

/**
 * Fetches the current user, returning null if not authenticated (401)
 * or if the social profile doesn't exist (403).
 * Use this for UI components that need to handle unauthenticated states gracefully.
 */
export async function getCurrentUserOrNull(): Promise<CurrentUserResponse | null> {
  try {
    const payload = await getJson<unknown>("/api/social/me", {
      credentials: "include",
    });

    const parsed = parseCurrentUserResponse(payload);
    if (!parsed) {
      return null;
    }

    return parsed;
  } catch (error) {
    // Check if it's an auth error (401) or no profile (403)
    if (error instanceof Error) {
      const statusMatch = error.message.match(/\((\d{3})(?:\s|$)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1], 10);
        // 401: Not authenticated, 403: No social profile
        if (status === 401 || status === 403) {
          return null;
        }
      }
    }
    // Re-throw for other errors
    throw error;
  }
}

export async function updateCurrentUser(
  input: UpdateCurrentUserRequest,
): Promise<CurrentUserResponse> {
  const res = await fetch("/api/social/me", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const parsed = parseCurrentUserResponse(payload);
  if (!parsed) {
    throw new Error("Invalid current user response format");
  }

  return parsed;
}

export async function uploadAvatar(file: File): Promise<CurrentUserResponse> {
  const formData = new FormData();
  formData.append("source", file);

  const res = await fetch("/api/social/me/avatar", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Upload failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const parsed = parseCurrentUserResponse(payload);
  if (!parsed) {
    throw new Error("Invalid avatar upload response format");
  }

  return parsed;
}

export async function uploadCover(file: File): Promise<CurrentUserResponse> {
  const formData = new FormData();
  formData.append("source", file);

  const res = await fetch("/api/social/me/cover", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Upload failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const parsed = parseCurrentUserResponse(payload);
  if (!parsed) {
    throw new Error("Invalid cover upload response format");
  }

  return parsed;
}

// ============ Comment APIs ============

import type { Comment } from "@/lib/social/types";

function parseCommentAuthor(value: unknown): Comment["author"] | null {
  if (!isRecord(value)) return null;

  const userId = typeof value.userId === "string" ? value.userId : null;
  const username = typeof value.username === "string" ? value.username : null;
  const displayName =
    typeof value.displayName === "string" ? value.displayName : null;

  if (!userId || !username || !displayName) return null;

  return {
    userId,
    username,
    displayName,
    avatarUrl: typeof value.avatarUrl === "string" ? value.avatarUrl : null,
  };
}

function parseComment(value: unknown): Comment | null {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "string" ? value.id : null;
  const postId = typeof value.postId === "string" ? value.postId : null;
  const content = typeof value.content === "string" ? value.content : null;
  const createdAt =
    typeof value.createdAt === "string" ? value.createdAt : null;
  const updatedAt =
    typeof value.updatedAt === "string" ? value.updatedAt : createdAt;

  if (!id || !postId || !content || !createdAt) return null;

  // Use updatedAt if present, otherwise fall back to createdAt
  const resolvedUpdatedAt = updatedAt ?? createdAt;

  // BUG #1 FIX: Handle both CommentResponse format (authorId) and CommentWithRepliesResponse format (author object)
  // Backend's createComment/replyToComment returns CommentResponse with authorId
  // Backend's fetchComments returns CommentWithRepliesResponse with author object
  let author = parseCommentAuthor(value.author);

  // If author object is not present but authorId exists, create minimal author from authorId
  if (!author) {
    const authorId = typeof value.authorId === "string" ? value.authorId : null;
    if (authorId) {
      author = {
        userId: authorId,
        username: "unknown",
        displayName: "Unknown User",
        avatarUrl: null,
      };
    }
  }

  if (!author) return null;

  const parentCommentId =
    typeof value.parentCommentId === "string" ? value.parentCommentId : null;
  const likeCount = typeof value.likeCount === "number" ? value.likeCount : 0;
  const dislikeCount =
    typeof value.dislikeCount === "number" ? value.dislikeCount : 0;
  const level = typeof value.level === "number" ? value.level : 0;

  let myReaction: "LIKE" | "DISLIKE" | null = null;
  if (value.myReaction === "LIKE" || value.myReaction === "DISLIKE") {
    myReaction = value.myReaction;
  }

  let replies: Comment[] = [];
  if (Array.isArray(value.replies)) {
    replies = value.replies
      .map((r: unknown) => parseComment(r))
      .filter((c): c is Comment => c !== null);
  }

  return {
    id,
    postId,
    parentCommentId,
    author,
    content,
    createdAt,
    updatedAt: resolvedUpdatedAt,
    likeCount,
    dislikeCount,
    myReaction,
    replies,
    level,
  };
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const res = await fetch(`/api/social/posts/${postId}/comments`, {
    method: "GET",
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((c: unknown) => parseComment(c))
    .filter((c): c is Comment => c !== null);
}

export type CreateCommentRequest = {
  content: string;
};

export async function createComment(
  postId: string,
  content: string,
): Promise<Comment> {
  const res = await fetch(`/api/social/posts/${postId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const parsed = parseComment(payload);
  if (!parsed) {
    throw new Error("Invalid comment response format");
  }

  return parsed;
}

export async function createReply(
  postId: string,
  commentId: string,
  content: string,
): Promise<Comment> {
  const res = await fetch(
    `/api/social/posts/${postId}/comments/${commentId}/replies`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
      credentials: "include",
    },
  );

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  const parsed = parseComment(payload);
  if (!parsed) {
    throw new Error("Invalid comment response format");
  }

  return parsed;
}

export async function toggleCommentReaction(
  postId: string,
  commentId: string,
  type: "LIKE" | "DISLIKE",
): Promise<void> {
  const res = await fetch(
    `/api/social/posts/${postId}/comments/${commentId}/reactions`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type }),
      credentials: "include",
    },
  );

  if (!res.ok) {
    const payload = res.headers
      .get("content-type")
      ?.includes("application/json")
      ? await res.json().catch(() => ({}))
      : {};
    const msg =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : "Request failed";

    throw new Error(msg || "Request failed");
  }
}

// ============ Telegram Verification APIs ============

export type TelegramVerificationStartResponse = {
  token: string;
  deepLink: string | null;
  expiresAt: string;
};

export async function startTelegramVerification(): Promise<TelegramVerificationStartResponse> {
  const res = await fetch("/api/social/me/telegram/verification/start", {
    method: "POST",
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  return payload as TelegramVerificationStartResponse;
}

// ============ Follow/Unfollow API ============

export type FollowUserResponse = {
  success: boolean;
  following: boolean;
};

export async function followUser(userId: string): Promise<FollowUserResponse> {
  const res = await fetch(`/api/social/follow/${userId}`, {
    method: "POST",
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  return payload as FollowUserResponse;
}

export async function unfollowUser(
  userId: string,
): Promise<FollowUserResponse> {
  const res = await fetch(`/api/social/follow/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  return payload as FollowUserResponse;
}

export async function checkFollowStatus(userId: string): Promise<boolean> {
  const res = await fetch(`/api/social/follow/${userId}/status`, {
    method: "GET",
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const fallback = `Request failed (${res.status} ${res.statusText})`;
    throw new Error(extractMessage(payload, fallback));
  }

  return (payload as { following: boolean }).following;
}
