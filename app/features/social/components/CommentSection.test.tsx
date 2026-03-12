/**
 * CommentSection Component Tests
 *
 * Tests for the frontend comment section including:
 * - CommentSection component rendering
 * - useComments hook functionality
 * - User interactions (posting comments, replying, reactions)
 * - Loading and error states
 * - Authentication handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentSection } from "@/features/social/components/CommentSection";

// Mock the useComments hook
vi.mock("@/features/social/hooks/useComments", () => ({
  useComments: vi.fn(() => ({
    comments: [],
    isLoading: false,
    error: null,
    addComment: vi.fn(),
    addReply: vi.fn(),
    toggleReaction: vi.fn(),
  })),
}));

// Mock the useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
  })),
}));

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, disabled, onClick, ...props }: any) => (
    <button
      data-testid="submit-button"
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({ value, onChange, placeholder, disabled }: any) => (
    <textarea
      data-testid="comment-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  MessageCircle: () => <div data-testid="message-circle-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  ThumbsUp: () => <div data-testid="thumbs-up-icon" />,
  ThumbsDown: () => <div data-testid="thumbs-down-icon" />,
  Reply: () => <div data-testid="reply-icon" />,
}));

// Import mocks after defining them
import { useComments } from "@/features/social/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";

describe("CommentSection Component", () => {
  const mockPostId = "post-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the comment section header", () => {
      render(<CommentSection postId={mockPostId} />);

      expect(screen.getByText("Comments")).toBeDefined();
      expect(screen.getByText("(0)")).toBeDefined();
    });

    it("should show login prompt when user is not authenticated", () => {
      render(<CommentSection postId={mockPostId} />);

      expect(screen.getByText(/Log in to leave a comment/i)).toBeDefined();
    });

    it("should show loading skeletons when auth is loading", () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      } as any);

      render(<CommentSection postId={mockPostId} />);

      expect(screen.getByTestId("skeleton")).toBeDefined();
    });

    it("should show comment input when user is authenticated", () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(<CommentSection postId={mockPostId} />);

      expect(screen.getByTestId("comment-input")).toBeDefined();
      expect(screen.getByTestId("submit-button")).toBeDefined();
    });
  });

  describe("Loading States", () => {
    it("should show loading skeletons when comments are loading", () => {
      vi.mocked(useComments).mockReturnValue({
        comments: [],
        isLoading: true,
        error: null,
        addComment: vi.fn(),
        addReply: vi.fn(),
        toggleReaction: vi.fn(),
      } as any);

      render(<CommentSection postId={mockPostId} />);

      // Should have skeleton elements
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should show error message when there's an error", () => {
      vi.mocked(useComments).mockReturnValue({
        comments: [],
        isLoading: false,
        error: "Failed to load comments",
        addComment: vi.fn(),
        addReply: vi.fn(),
        toggleReaction: vi.fn(),
      } as any);

      render(<CommentSection postId={mockPostId} />);

      expect(screen.getByText("Failed to load comments")).toBeDefined();
    });
  });

  describe("Empty State", () => {
    it("should show empty state message when there are no comments", () => {
      vi.mocked(useComments).mockReturnValue({
        comments: [],
        isLoading: false,
        error: null,
        addComment: vi.fn(),
        addReply: vi.fn(),
        toggleReaction: vi.fn(),
      } as any);

      render(<CommentSection postId={mockPostId} />);

      expect(screen.getByText(/Be the first to comment/i)).toBeDefined();
    });
  });

  describe("Comment Display", () => {
    it("should render comments when they exist", () => {
      const mockComments = [
        {
          id: "comment-1",
          postId: "post-123",
          parentCommentId: null,
          author: {
            userId: "user-1",
            username: "testuser",
            displayName: "Test User",
            avatarUrl: null,
          },
          content: "This is a test comment",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          likeCount: 5,
          dislikeCount: 0,
          myReaction: null,
          replies: [],
          level: 0,
        },
      ];

      vi.mocked(useComments).mockReturnValue({
        comments: mockComments,
        isLoading: false,
        error: null,
        addComment: vi.fn(),
        addReply: vi.fn(),
        toggleReaction: vi.fn(),
      } as any);

      render(<CommentSection postId={mockPostId} />);

      expect(screen.getByText("This is a test comment")).toBeDefined();
    });

    it("should display nested replies", () => {
      const mockComments = [
        {
          id: "comment-1",
          postId: "post-123",
          parentCommentId: null,
          author: {
            userId: "user-1",
            username: "testuser",
            displayName: "Test User",
            avatarUrl: null,
          },
          content: "Parent comment",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          likeCount: 3,
          dislikeCount: 0,
          myReaction: null,
          replies: [
            {
              id: "reply-1",
              postId: "post-123",
              parentCommentId: "comment-1",
              author: {
                userId: "user-2",
                username: "replyuser",
                displayName: "Reply User",
                avatarUrl: null,
              },
              content: "This is a reply",
              createdAt: "2026-01-02T00:00:00.000Z",
              updatedAt: "2026-01-02T00:00:00.000Z",
              likeCount: 1,
              dislikeCount: 0,
              myReaction: null,
              replies: [],
              level: 1,
            },
          ],
          level: 0,
        },
      ];

      vi.mocked(useComments).mockReturnValue({
        comments: mockComments,
        isLoading: false,
        error: null,
        addComment: vi.fn(),
        addReply: vi.fn(),
        toggleReaction: vi.fn(),
      } as any);

      render(<CommentSection postId={mockPostId} />);

      expect(screen.getByText("Parent comment")).toBeDefined();
      expect(screen.getByText("This is a reply")).toBeDefined();
    });

    it("should update comment count correctly with nested comments", () => {
      const mockComments = [
        {
          id: "comment-1",
          postId: "post-123",
          parentCommentId: null,
          author: {
            userId: "user-1",
            username: "testuser",
            displayName: "Test User",
            avatarUrl: null,
          },
          content: "Parent comment",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          likeCount: 3,
          dislikeCount: 0,
          myReaction: null,
          replies: [
            {
              id: "reply-1",
              postId: "post-123",
              parentCommentId: "comment-1",
              author: {
                userId: "user-2",
                username: "replyuser",
                displayName: "Reply User",
                avatarUrl: null,
              },
              content: "First reply",
              createdAt: "2026-01-02T00:00:00.000Z",
              updatedAt: "2026-01-02T00:00:00.000Z",
              likeCount: 1,
              dislikeCount: 0,
              myReaction: null,
              replies: [
                {
                  id: "reply-2",
                  postId: "post-123",
                  parentCommentId: "reply-1",
                  author: {
                    userId: "user-3",
                    username: "nesteduser",
                    displayName: "Nested User",
                    avatarUrl: null,
                  },
                  content: "Nested reply",
                  createdAt: "2026-01-03T00:00:00.000Z",
                  updatedAt: "2026-01-03T00:00:00.000Z",
                  likeCount: 0,
                  dislikeCount: 0,
                  myReaction: null,
                  replies: [],
                  level: 2,
                },
              ],
              level: 1,
            },
          ],
          level: 0,
        },
      ];

      vi.mocked(useComments).mockReturnValue({
        comments: mockComments,
        isLoading: false,
        error: null,
        addComment: vi.fn(),
        addReply: vi.fn(),
        toggleReaction: vi.fn(),
      } as any);

      render(<CommentSection postId={mockPostId} />);

      // Should show (3) - 1 parent + 2 replies
      expect(screen.getByText("(3)")).toBeDefined();
    });
  });

  describe("User Interactions", () => {
    it("should allow typing in comment input", async () => {
      const user = userEvent.setup();

      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(<CommentSection postId={mockPostId} />);

      const input = screen.getByTestId("comment-input");
      await user.type(input, "Test comment content");

      expect(input).toHaveValue("Test comment content");
    });

    it("should disable submit button when input is empty", () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(<CommentSection postId={mockPostId} />);

      const button = screen.getByTestId("submit-button");
      expect(button).toBeDisabled();
    });

    it("should enable submit button when input has content", async () => {
      const user = userEvent.setup();

      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(<CommentSection postId={mockPostId} />);

      const input = screen.getByTestId("comment-input");
      await user.type(input, "Test comment");

      const button = screen.getByTestId("submit-button");
      expect(button).not.toBeDisabled();
    });

    it("should call addComment when submitting", async () => {
      const user = userEvent.setup();
      const mockAddComment = vi.fn().mockResolvedValue({});

      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      vi.mocked(useComments).mockReturnValue({
        comments: [],
        isLoading: false,
        error: null,
        addComment: mockAddComment,
        addReply: vi.fn(),
        toggleReaction: vi.fn(),
      } as any);

      render(<CommentSection postId={mockPostId} />);

      const input = screen.getByTestId("comment-input");
      await user.type(input, "New comment");

      const button = screen.getByTestId("submit-button");
      await user.click(button);

      await waitFor(() => {
        expect(mockAddComment).toHaveBeenCalledWith("New comment");
      });
    });

    it("should clear input after successful submission", async () => {
      const user = userEvent.setup();
      const mockAddComment = vi.fn().mockResolvedValue({});

      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      vi.mocked(useComments).mockReturnValue({
        comments: [],
        isLoading: false,
        error: null,
        addComment: mockAddComment,
        addReply: vi.fn(),
        toggleReaction: vi.fn(),
      } as any);

      render(<CommentSection postId={mockPostId} />);

      const input = screen.getByTestId("comment-input");
      await user.type(input, "New comment");

      const button = screen.getByTestId("submit-button");
      await user.click(button);

      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });

    it("should show error message on submission failure", async () => {
      const user = userEvent.setup();
      const mockAddComment = vi
        .fn()
        .mockRejectedValue(new Error("Network error"));

      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      vi.mocked(useComments).mockReturnValue({
        comments: [],
        isLoading: false,
        error: null,
        addComment: mockAddComment,
        addReply: vi.fn(),
        toggleReaction: vi.fn(),
      } as any);

      render(<CommentSection postId={mockPostId} />);

      const input = screen.getByTestId("comment-input");
      await user.type(input, "New comment");

      const button = screen.getByTestId("submit-button");
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Failed to post comment/i)).toBeDefined();
      });
    });
  });

  describe("Authentication Flow", () => {
    it("should show login link when not authenticated", () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(<CommentSection postId={mockPostId} />);

      expect(screen.getByRole("link", { name: /Log in/i })).toBeDefined();
    });

    it("should not show comment input when not authenticated", () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(<CommentSection postId={mockPostId} />);

      expect(screen.queryByTestId("comment-input")).toBeNull();
    });

    it("should pass isAuthenticated to child components", () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(<CommentSection postId={mockPostId} />);

      // When authenticated, comment input should be visible
      expect(screen.getByTestId("comment-input")).toBeDefined();
    });
  });
});
