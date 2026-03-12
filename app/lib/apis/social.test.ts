import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createComment,
  fetchSocialPostsPage,
  fetchPostDetail,
  togglePostReaction,
  generateSlugFromTitle,
  unlockPost,
} from "./social";

describe("social API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createComment", () => {
    it("throws backend error message when createComment returns 500", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 500,
            message: "An unexpected error occurred",
          }),
          {
            status: 500,
            statusText: "Internal Server Error",
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      );

      await expect(createComment("post-1", "test")).rejects.toThrow(
        "An unexpected error occurred",
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/social/posts/post-1/comments",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "test" }),
          credentials: "include",
        },
      );
    });
  });

  describe("fetchSocialPostsPage", () => {
    it("parses items and uses pagination headers (x-has-next, x-page)", async () => {
      const payload = [
        {
          id: "1",
          title: "Hello",
          caption: "World",
          cover: "/img.png",
          author: { username: "alice" },
          myReaction: "LIKE",
          createdAt: "2020-01-01T00:00:00.000Z",
          likeCount: 3,
          dislikeCount: 1,
        },
      ];

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-has-next": "true",
            "x-page": "2",
          },
        }),
      );

      const res = await fetchSocialPostsPage({ page: 0, size: 10 });
      expect(res.hasNext).toBe(true);
      expect(res.page).toBe(2);
      expect(res.items).toHaveLength(1);
      expect(res.items[0]).toMatchObject({
        id: "1",
        title: "Hello",
        caption: "World",
        cover: "/img.png",
        author: { username: "alice" },
        myReaction: "LIKE",
        likeCount: 3,
        dislikeCount: 1,
      });
    });
  });

  describe("fetchPostDetail", () => {
    it("throws when payload is missing required fields (id/title)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ content: "x" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      await expect(fetchPostDetail("p1")).rejects.toThrow(
        "Invalid post response format",
      );
    });
  });

  describe("togglePostReaction", () => {
    it("returns reaction counts and calls endpoint with correct payload", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ likeCount: 5, dislikeCount: 2 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

      const out = await togglePostReaction("post-123", "LIKE");
      expect(out).toEqual({ likeCount: 5, dislikeCount: 2 });
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/social/posts/post-123/reactions",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "LIKE" }),
          credentials: "include",
        },
      );
    });
  });

  describe("generateSlugFromTitle", () => {
    it("normalizes spacing, casing and special characters", () => {
      expect(generateSlugFromTitle("  Hello, World!  ")).toBe("hello-world");
      expect(generateSlugFromTitle("A__B   C")).toBe("a-b-c");
      expect(generateSlugFromTitle("Dashes---and__underscores")).toBe(
        "dashes-and-underscores",
      );
    });
  });

  describe("unlockPost", () => {
    it("throws backend error message on 403 with JSON payload", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ message: "Wrong password" }), {
          status: 403,
          statusText: "Forbidden",
          headers: { "content-type": "application/json" },
        }),
      );

      await expect(unlockPost("post-1", "badpass")).rejects.toThrow(
        "Wrong password",
      );
    });
  });
});
