import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useComments } from "./useComments";
import {
  createComment,
  createReply,
  fetchComments,
  toggleCommentReaction,
} from "@/lib/apis/social";
import type { Comment } from "@/lib/social/types";

vi.mock("@/lib/apis/social", () => ({
  fetchComments: vi.fn(),
  createComment: vi.fn(),
  createReply: vi.fn(),
  toggleCommentReaction: vi.fn(),
}));

const mockedFetchComments = vi.mocked(fetchComments);
const mockedCreateComment = vi.mocked(createComment);
const mockedCreateReply = vi.mocked(createReply);
const mockedToggleCommentReaction = vi.mocked(toggleCommentReaction);

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: "comment-1",
    postId: "post-1",
    parentCommentId: null,
    author: {
      userId: "user-1",
      username: "user1",
      displayName: "User One",
      avatarUrl: null,
    },
    content: "Comment content",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    likeCount: 0,
    dislikeCount: 0,
    myReaction: null,
    replies: [],
    level: 0,
    ...overrides,
  };
}

describe("useComments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tải danh sách bình luận thành công khi mount", async () => {
    const initialComments = [makeComment()];
    mockedFetchComments.mockResolvedValue(initialComments);

    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => {
      expect(result.current.comments).toEqual(initialComments);
    });
    expect(result.current.error).toBeNull();
    expect(mockedFetchComments).toHaveBeenCalledWith("post-1");
  });

  it("lưu lỗi khi tải bình luận thất bại", async () => {
    mockedFetchComments.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => {
      expect(result.current.error).toBe("network error");
    });
  });

  it("addComment gọi API tạo mới và refresh lại danh sách", async () => {
    const created = makeComment({ id: "new-comment", content: "New comment" });
    mockedFetchComments.mockResolvedValue([]);
    mockedCreateComment.mockResolvedValue(created);

    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => {
      expect(mockedFetchComments).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.addComment("New comment");
    });

    expect(mockedCreateComment).toHaveBeenCalledWith("post-1", "New comment");
    expect(mockedFetchComments).toHaveBeenCalledTimes(2);
  });

  it("addComment ném lỗi từ API và không refresh lại danh sách", async () => {
    const apiError = new Error("An unexpected error occurred");
    mockedFetchComments.mockResolvedValue([]);
    mockedCreateComment.mockRejectedValue(apiError);

    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => {
      expect(mockedFetchComments).toHaveBeenCalledTimes(1);
    });

    await expect(result.current.addComment("Broken comment")).rejects.toThrow(
      "An unexpected error occurred",
    );
    expect(mockedCreateComment).toHaveBeenCalledWith(
      "post-1",
      "Broken comment",
    );
    expect(mockedFetchComments).toHaveBeenCalledTimes(1);
  });

  it("addReply gọi API trả lời và refresh lại danh sách", async () => {
    const created = makeComment({
      id: "reply-1",
      parentCommentId: "comment-1",
      level: 1,
    });
    mockedFetchComments.mockResolvedValue([]);
    mockedCreateReply.mockResolvedValue(created);

    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => {
      expect(mockedFetchComments).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.addReply("comment-1", "Reply content");
    });

    expect(mockedCreateReply).toHaveBeenCalledWith(
      "post-1",
      "comment-1",
      "Reply content",
    );
    expect(mockedFetchComments).toHaveBeenCalledTimes(2);
  });

  it("toggleReaction cập nhật optimistic và gọi API thành công", async () => {
    const initialComments = [
      makeComment({
        id: "comment-1",
        likeCount: 0,
        dislikeCount: 0,
        myReaction: null,
      }),
    ];
    mockedFetchComments.mockResolvedValue(initialComments);
    mockedToggleCommentReaction.mockResolvedValue(undefined);

    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
    });

    await act(async () => {
      await result.current.toggleReaction("comment-1", "LIKE");
    });

    expect(result.current.comments[0]?.likeCount).toBe(1);
    expect(result.current.comments[0]?.myReaction).toBe("LIKE");
    expect(mockedToggleCommentReaction).toHaveBeenCalledWith(
      "post-1",
      "comment-1",
      "LIKE",
    );
  });

  it("toggleReaction rollback lại dữ liệu khi API lỗi", async () => {
    const initialComments = [
      makeComment({
        id: "comment-1",
        likeCount: 0,
        dislikeCount: 0,
        myReaction: null,
      }),
    ];
    mockedFetchComments
      .mockResolvedValueOnce(initialComments)
      .mockResolvedValueOnce(initialComments);
    mockedToggleCommentReaction.mockRejectedValue(new Error("cannot react"));

    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
    });

    await act(async () => {
      await result.current
        .toggleReaction("comment-1", "LIKE")
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(mockedFetchComments).toHaveBeenCalledTimes(2);
    });
    expect(result.current.comments[0]?.likeCount).toBe(0);
    expect(result.current.comments[0]?.myReaction).toBeNull();
  });
});
