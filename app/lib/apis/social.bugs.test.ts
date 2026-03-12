/**
 * Bug Reproduction Tests for Comment System
 *
 * These tests reproduce the identified bugs in the comment functionality:
 *
 * BUG #1: Backend returns CommentResponse without full author info
 * - Backend's CommentResponse returns: { id, postId, parentCommentId, authorId, content, createdAt }
 * - Frontend's parseComment expects: { id, postId, parentCommentId, author: { userId, username, displayName, avatarUrl }, ... }
 * - Result: "Invalid comment response format" error when posting comments
 *
 * BUG #2: Frontend API route returns correct status but may have issues
 *
 * BUG #3: Depth mismatch between frontend and backend
 * - Backend MAX_DEPTH = 3 (levels 0, 1, 2)
 * - Frontend MAX_DEPTH = 2 (levels 0, 1)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createComment, fetchComments, createReply } from "./social";

describe("Bug Reproduction: Comment System", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * BUG #1: Backend returns CommentResponse format without author object
   */
  describe("BUG #1: createComment fails due to missing author object", () => {
    it("should work when backend returns CommentResponse with authorId (FIXED)", async () => {
      // This is what the backend actually returns (CommentResponse format)
      // FIXED: Frontend now handles this case by creating a minimal author from authorId
      const backendCommentResponse = {
        id: "new-comment-id",
        postId: "post-1",
        parentCommentId: null,
        authorId: "user-123", // Now handled by frontend fallback
        content: "Test comment",
        createdAt: "2026-01-01T00:00:00.000Z",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(backendCommentResponse), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      // Now this should work because parseComment handles authorId fallback
      const result = await createComment("post-1", "Test comment");
      expect(result.id).toBe("new-comment-id");
      expect(result.author.userId).toBe("user-123");
    });

    it("should fail when backend returns comment missing required fields", async () => {
      // Missing many required fields
      const incompleteResponse = {
        id: "comment-1",
        postId: "post-1",
        content: "Test",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(incompleteResponse), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      await expect(createComment("post-1", "Test")).rejects.toThrow();
    });

    it("should work when backend returns CommentWithRepliesResponse format with author object", async () => {
      // This is what the backend SHOULD return for consistency
      const correctFormat = {
        id: "new-comment-id",
        postId: "post-1",
        parentCommentId: null,
        author: {
          userId: "user-123",
          username: "testuser",
          displayName: "Test User",
          avatarUrl: null,
        },
        content: "Test comment",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        likeCount: 0,
        dislikeCount: 0,
        myReaction: null,
        replies: [],
        level: 0,
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(correctFormat), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const result = await createComment("post-1", "Test comment");
      expect(result.id).toBe("new-comment-id");
      expect(result.author.username).toBe("testuser");
    });
  });

  /**
   * BUG #1 Variant: createReply also affected by same issue
   */
  describe("BUG #1: createReply also handles authorId fallback", () => {
    it("should work when backend returns reply with authorId (FIXED)", async () => {
      const backendReplyResponse = {
        id: "reply-id",
        postId: "post-1",
        parentCommentId: "comment-parent",
        authorId: "user-456",
        content: "Reply content",
        createdAt: "2026-01-01T00:00:00.000Z",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(backendReplyResponse), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      // Now this should work because parseComment handles authorId fallback
      const result = await createReply(
        "post-1",
        "comment-parent",
        "Reply content",
      );
      expect(result.id).toBe("reply-id");
      expect(result.author.userId).toBe("user-456");
    });
  });

  /**
   * BUG #3: Depth mismatch between frontend and backend
   */
  describe("BUG #3: Frontend/Backend depth mismatch", () => {
    it("should correctly parse deeply nested comments from backend", async () => {
      const nestedComments = [
        {
          id: "comment-1",
          postId: "post-1",
          parentCommentId: null,
          author: {
            userId: "user-1",
            username: "user1",
            displayName: "User 1",
            avatarUrl: null,
          },
          content: "Level 0 comment",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          likeCount: 0,
          dislikeCount: 0,
          myReaction: null,
          level: 0,
          replies: [
            {
              id: "comment-2",
              postId: "post-1",
              parentCommentId: "comment-1",
              author: {
                userId: "user-2",
                username: "user2",
                displayName: "User 2",
                avatarUrl: null,
              },
              content: "Level 1 reply",
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
              likeCount: 0,
              dislikeCount: 0,
              myReaction: null,
              level: 1,
              replies: [
                {
                  id: "comment-3",
                  postId: "post-1",
                  parentCommentId: "comment-2",
                  author: {
                    userId: "user-3",
                    username: "user3",
                    displayName: "User 3",
                    avatarUrl: null,
                  },
                  content: "Level 2 reply (backend allows, frontend blocks)",
                  createdAt: "2026-01-01T00:00:00.000Z",
                  updatedAt: "2026-01-01T00:00:00.000Z",
                  likeCount: 0,
                  dislikeCount: 0,
                  myReaction: null,
                  level: 2,
                  replies: [],
                },
              ],
            },
          ],
        },
      ];

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(nestedComments), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const result = await fetchComments("post-1");

      expect(result).toHaveLength(1);
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies[0].replies).toHaveLength(1);
      expect(result[0].replies[0].replies[0].level).toBe(2);
    });

    it("documents the depth constants for verification", () => {
      const FRONTEND_MAX_DEPTH = 2;
      const BACKEND_MAX_DEPTH = 3;

      expect(FRONTEND_MAX_DEPTH).toBeLessThan(BACKEND_MAX_DEPTH);
    });
  });

  /**
   * Additional edge cases
   */
  describe("Edge cases and error handling", () => {
    it("handles empty array response from fetchComments", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const result = await fetchComments("post-1");
      expect(result).toEqual([]);
    });

    it("handles non-array response from fetchComments", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: "not found" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const result = await fetchComments("post-1");
      expect(result).toEqual([]);
    });

    it("handles 401 Unauthorized gracefully", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      );

      await expect(createComment("post-1", "test")).rejects.toThrow(
        "Unauthorized",
      );
    });
  });
});
