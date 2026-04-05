export type TopicInfo = {
  id: string;
  name: string;
} | null;

export type FeedPost = {
  id: string;
  author?: {
    authorId: string;
  };
  authorName: string;
  authorAvatarSrc?: string | null;
  authorRole?: string;
  title: string;
  caption?: string;
  score: number;
  createdAtLabel: string;
  image?: { src: string; alt: string };
  userReaction?: "LIKE" | "DISLIKE" | null;
  /** Number of likes on this post */
  likeCount: number;
  /** Number of dislikes on this post */
  dislikeCount: number;
  /** Topic/community this post belongs to */
  topic?: TopicInfo;
};

export type PostDetailAuthor = {
  authorId: string;
  username: string;
  avatarUrl?: string | null;
};

export type PostDetailResponse = {
  id: string;
  title: string;
  content: string | null; // Can be null for locked/password-protected posts
  locked: boolean;
  cover?: string;
  caption?: string;
  visibility: string;
  author: PostDetailAuthor;
  myReaction?: "LIKE" | "DISLIKE" | null;
  tags: string[];
  /** Topic/community this post belongs to */
  topic: TopicInfo;
  // Java Instant is serialized as ISO-8601 string in JSON
  createdAt: string;
  updatedAt: string;
  /** Number of likes on this post */
  likeCount: number;
  /** Number of dislikes on this post */
  dislikeCount: number;
};

export type Topic = {
  id: string;
  name: string;
  membersLabel: string;
};

export type Announcement = {
  authorName: string;
  body: string;
};

// User Profile Types
export type UserProfile = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  followersCount: number;
  followingCount: number;
  joinedAt: string;
  isOnline?: boolean;
};

export type UserPost = FeedPost & {
  visibility: "PUBLIC" | "ENCRYPTED" | "DRAFT";
};

export type NewFollower = {
  id: string;
  displayName: string;
  username?: string;
  bio?: string;
  avatarUrl?: string | null;
};

export type ProfileTab = "posts" | "comments" | "saved" | "about";

export type PostFilter = "all" | "public" | "encrypted" | "drafts";

// Comment Types
export type CommentAuthor = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type Comment = {
  id: string;
  postId: string;
  parentCommentId: string | null;
  author: CommentAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  dislikeCount: number;
  myReaction: "LIKE" | "DISLIKE" | null;
  replies: Comment[];
  level: number;
};
