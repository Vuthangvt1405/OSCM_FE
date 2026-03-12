/**
 * API Route Tests for Comments
 *
 * Tests for the POST and GET endpoints:
 * - POST /api/social/posts/:postId/comments - Create a new comment
 * - GET /api/social/posts/:postId/comments - Fetch comments for a post
 *
 * These tests verify the API route layer handles requests correctly
 * and properly forwards to the backend.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock cookies() - must be before importing the route
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock getBackendBaseUrl
vi.mock("@/lib/server/backend", () => ({
  getBackendBaseUrl: vi.fn(() => "http://localhost:8080"),
}));

// Import after mocks
import { cookies } from "next/headers";
import { POST, GET } from "./route";

const mockCookies = vi.mocked(cookies);

describe("POST /api/social/posts/[postId]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    // Mock unauthenticated cookies
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const req = new Request(
      "http://localhost/api/social/posts/post-1/comments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Test comment" }),
      },
    );

    const params = Promise.resolve({ postId: "post-1" });
    const response = await POST(req, { params });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.message).toBe("Unauthorized");
  });

  it("should successfully create comment when authenticated", async () => {
    // Mock authenticated cookies
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "mock-jwt-token" }),
    } as any);

    // Mock successful backend response
    const backendResponse = {
      id: "comment-new-123",
      postId: "post-1",
      parentCommentId: null,
      authorId: "user-123",
      content: "Test comment",
      createdAt: "2026-03-04T00:00:00.000Z",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(backendResponse), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const req = new Request(
      "http://localhost/api/social/posts/post-1/comments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Test comment" }),
      },
    );

    const params = Promise.resolve({ postId: "post-1" });
    const response = await POST(req, { params });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe("comment-new-123");
    expect(data.content).toBe("Test comment");
  });

  it("should forward request to correct backend endpoint", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "mock-jwt-token" }),
    } as any);

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "comment-1" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const req = new Request(
      "http://localhost/api/social/posts/test-post-id/comments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello" }),
      },
    );

    const params = Promise.resolve({ postId: "test-post-id" });
    await POST(req, { params });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8080/social/posts/test-post-id/comments",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          authorization: "Bearer mock-jwt-token",
        }),
        body: JSON.stringify({ content: "Hello" }),
      }),
    );
  });

  it("should return error from backend when backend returns 400", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "mock-jwt-token" }),
    } as any);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Content is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );

    const req = new Request(
      "http://localhost/api/social/posts/post-1/comments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      },
    );

    const params = Promise.resolve({ postId: "post-1" });
    const response = await POST(req, { params });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Content is required");
  });

  it("should return 500 when backend is unreachable", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "mock-jwt-token" }),
    } as any);

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const req = new Request(
      "http://localhost/api/social/posts/post-1/comments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Test" }),
      },
    );

    const params = Promise.resolve({ postId: "post-1" });
    const response = await POST(req, { params });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe("Internal server error");
  });
});

describe("GET /api/social/posts/[postId]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch comments successfully without authentication", async () => {
    // Mock unauthenticated cookies (should still work for GET)
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const backendComments = [
      {
        id: "comment-1",
        postId: "post-1",
        parentCommentId: null,
        author: {
          userId: "user-1",
          username: "testuser",
          displayName: "Test User",
          avatarUrl: null,
        },
        content: "First comment",
        createdAt: "2026-03-04T00:00:00.000Z",
        updatedAt: "2026-03-04T00:00:00.000Z",
        likeCount: 0,
        dislikeCount: 0,
        myReaction: null,
        level: 0,
        replies: [],
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(backendComments), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const req = new Request(
      "http://localhost/api/social/posts/post-1/comments",
    );
    const params = Promise.resolve({ postId: "post-1" });
    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("comment-1");
  });

  it("should include auth token when user is authenticated", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "user-jwt-token" }),
    } as any);

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const req = new Request(
      "http://localhost/api/social/posts/post-1/comments",
    );
    const params = Promise.resolve({ postId: "post-1" });
    await GET(req, { params });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8080/social/posts/post-1/comments",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          authorization: "Bearer user-jwt-token",
        }),
      }),
    );
  });

  it("should forward error status from backend", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Post not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );

    const req = new Request(
      "http://localhost/api/social/posts/nonexistent-post/comments",
    );
    const params = Promise.resolve({ postId: "nonexistent-post" });
    const response = await GET(req, { params });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.message).toBe("Post not found");
  });

  it("should return 500 when backend is unreachable", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("Connection refused"),
    );

    const req = new Request(
      "http://localhost/api/social/posts/post-1/comments",
    );
    const params = Promise.resolve({ postId: "post-1" });
    const response = await GET(req, { params });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe("Internal server error");
  });

  it("should pass through non-JSON responses", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Service unavailable", {
        status: 503,
        headers: { "content-type": "text/plain" },
      }),
    );

    const req = new Request(
      "http://localhost/api/social/posts/post-1/comments",
    );
    const params = Promise.resolve({ postId: "post-1" });
    const response = await GET(req, { params });

    expect(response.status).toBe(503);
  });
});
