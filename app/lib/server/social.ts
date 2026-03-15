import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getBackendBaseUrl } from "./backend";
import type { PostDetailResponse, PostDetailAuthor } from "@/lib/social/types";

// Define CurrentUserResponse locally to avoid circular dependency with @/lib/apis/social
type CurrentUserResponse = {
  userId: string;
  username: string;
  displayName?: string | null;
  email?: string | null;
  profilePictureUrl?: string | null;
  bio?: string | null;
  telegramId?: string | null;
  createdAt?: string | null;
};

type ErrorShape = {
  message?: string;
  status?: number;
  timestamp?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string") return payload || fallback;
  if (isRecord(payload) && typeof payload.message === "string")
    return payload.message || fallback;
  return fallback;
}

function parseCurrentUserResponse(value: unknown): CurrentUserResponse | null {
  if (!isRecord(value)) return null;

  const userId = typeof value.userId === "string" ? value.userId : null;
  const username = typeof value.username === "string" ? value.username : null;
  const displayName =
    typeof value.displayName === "string" ? value.displayName : null;
  const email = typeof value.email === "string" ? value.email : null;
  const profilePictureUrl =
    typeof value.profilePictureUrl === "string"
      ? value.profilePictureUrl
      : null;
  const bio = typeof value.bio === "string" ? value.bio : null;
  const telegramId =
    typeof value.telegramId === "string" ? value.telegramId : null;
  const createdAt =
    typeof value.createdAt === "string" ? value.createdAt : null;

  if (!userId || !username) return null;

  return {
    userId,
    username,
    displayName,
    email,
    profilePictureUrl,
    bio,
    telegramId,
    createdAt,
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

/**
 * Server-side function to fetch post detail
 * Designed for use in Server Components (SSR)
 * Supports both authenticated and guest access
 */
export async function fetchPostDetailServer(
  postId: string,
): Promise<PostDetailResponse> {
  const backendBaseUrl = getBackendBaseUrl();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  // Token is optional - guests can view public posts
  // Backend handles both authenticated and unauthenticated requests
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${backendBaseUrl}/api/social/posts/${postId}`, {
    method: "GET",
    headers,
    cache: "no-store",
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
 * Server-side function to fetch current user, returning null if not authenticated
 * Designed for use in Server Components (SSR)
 * Reads cookies directly and passes them as Authorization header
 */
export async function getCurrentUserOrNullServer(): Promise<CurrentUserResponse | null> {
  const backendBaseUrl = getBackendBaseUrl();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  // If no token, return null (not authenticated)
  if (!token) {
    return null;
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(`${backendBaseUrl}/api/social/me`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    // If 401 or 403, return null (not authenticated or no social profile)
    if (res.status === 401 || res.status === 403) {
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const payload: unknown = contentType.includes("application/json")
      ? await res.json().catch(() => null)
      : await res.text().catch(() => "");

    if (!res.ok) {
      const fallback = `Request failed (${res.status} ${res.statusText})`;
      throw new Error(extractMessage(payload as ErrorShape, fallback));
    }

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
