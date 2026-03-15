/**
 * Search Dropdown Component
 *
 * Shows quick search results in a dropdown format
 * with categorized results and "View All" links.
 */

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  UnifiedSearchResponse,
  SearchEntityType,
  SEARCH_TABS,
} from "../types/unified-search";
import { ArrowRight, User, FileText, Folder, Tag } from "lucide-react";

interface SearchDropdownProps {
  /** Search results */
  results?: UnifiedSearchResponse;
  /** Whether dropdown is loading */
  isLoading: boolean;
  /** Whether dropdown is open */
  isOpen: boolean;
  /** Callback when closing dropdown */
  onClose: () => void;
  /** Base URL for search page */
  searchPageUrl?: string;
}

/**
 * Icon component for entity types
 */
function EntityIcon({ type }: { type: SearchEntityType }) {
  switch (type) {
    case "users":
      return <User className="w-4 h-4" />;
    case "posts":
      return <FileText className="w-4 h-4" />;
    case "topics":
      return <Folder className="w-4 h-4" />;
    case "tags":
      return <Tag className="w-4 h-4" />;
    default:
      return null;
  }
}

/**
 * User result item
 */
function UserResultItem({
  user,
  onClick,
}: {
  user: {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  onClick?: () => void;
}) {
  return (
    <Link
      href={`/profile/${user.userId}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">@{user.username}</p>
        <p className="text-sm text-muted-foreground truncate">
          {user.displayName}
        </p>
      </div>
    </Link>
  );
}

/**
 * Topic result item
 */
function TopicResultItem({
  topic,
  onClick,
}: {
  topic: {
    id: string;
    name: string;
    description: string;
    membersCount: number;
  };
  onClick?: () => void;
}) {
  return (
    <Link
      href={`/topics/${topic.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
        <Folder className="w-5 h-5 text-secondary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">#{topic.name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {topic.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {topic.membersCount} members
        </p>
      </div>
    </Link>
  );
}

/**
 * Post result item
 */
function PostResultItem({
  post,
  onClick,
}: {
  post: {
    id: string;
    title: string;
    caption: string;
    cover: string | null;
    author: { username: string } | null;
  };
  onClick?: () => void;
}) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
      onClick={onClick}
    >
      {post.cover && post.cover !== "default" ? (
        <img
          src={post.cover}
          alt=""
          className="w-12 h-12 rounded-lg object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
          <FileText className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate line-clamp-2">{post.title}</p>
        {post.author && (
          <p className="text-sm text-muted-foreground">
            @{post.author.username}
          </p>
        )}
      </div>
    </Link>
  );
}

/**
 * Tag result item
 */
function TagResultItem({
  tag,
  onClick,
}: {
  tag: { id: string; name: string };
  onClick?: () => void;
}) {
  return (
    <Link
      href={`/tags/${tag.name}`}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
      onClick={onClick}
    >
      <Tag className="w-4 h-4 text-muted-foreground" />
      <span className="font-medium">#{tag.name}</span>
    </Link>
  );
}

/**
 * Result section
 */
function ResultSection({
  title,
  icon,
  items,
  type,
  viewAllUrl,
  onItemClick,
}: {
  title: string;
  icon: React.ReactNode;
  items: React.ReactNode[];
  type: SearchEntityType;
  viewAllUrl: string;
  onItemClick?: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
          <span className="text-xs">({items.length})</span>
        </div>
        <Link
          href={viewAllUrl}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
          onClick={onItemClick}
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-1">{items}</div>
    </div>
  );
}

/**
 * Search dropdown with categorized results
 */
export function SearchDropdown({
  results,
  isLoading,
  isOpen,
  onClose,
  searchPageUrl = "/search",
}: SearchDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  const hasResults =
    results &&
    (results.users.length > 0 ||
      results.topics.length > 0 ||
      results.posts.length > 0 ||
      results.tags.length > 0);

  return (
    <div
      ref={containerRef}
      className="
        absolute top-full left-0 right-0 mt-2
        z-50
        bg-background
        border
        rounded-xl
        shadow-lg
        overflow-hidden
        max-h-[70vh]
        overflow-y-auto
      "
    >
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Results */}
      {!isLoading && hasResults && (
        <>
          {/* Users */}
          {results && results.users.length > 0 && (
            <ResultSection
              title="Users"
              icon={<User className="w-4 h-4" />}
              items={results.users.slice(0, 3).map((user) => (
                <UserResultItem
                  key={user.userId}
                  user={user}
                  onClick={onClose}
                />
              ))}
              type="users"
              viewAllUrl={`${searchPageUrl}?q=${encodeURIComponent("")}&tab=users`}
              onItemClick={onClose}
            />
          )}

          {/* Topics */}
          {results && results.topics.length > 0 && (
            <ResultSection
              title="Topics"
              icon={<Folder className="w-4 h-4" />}
              items={results.topics.slice(0, 2).map((topic) => (
                <TopicResultItem
                  key={topic.id}
                  topic={topic}
                  onClick={onClose}
                />
              ))}
              type="topics"
              viewAllUrl={`${searchPageUrl}?q=${encodeURIComponent("")}&tab=topics`}
              onItemClick={onClose}
            />
          )}

          {/* Posts */}
          {results && results.posts.length > 0 && (
            <ResultSection
              title="Posts"
              icon={<FileText className="w-4 h-4" />}
              items={results.posts.slice(0, 3).map((post) => (
                <PostResultItem key={post.id} post={post} onClick={onClose} />
              ))}
              type="posts"
              viewAllUrl={`${searchPageUrl}?q=${encodeURIComponent("")}&tab=posts`}
              onItemClick={onClose}
            />
          )}

          {/* Tags */}
          {results && results.tags.length > 0 && (
            <ResultSection
              title="Tags"
              icon={<Tag className="w-4 h-4" />}
              items={results.tags.slice(0, 4).map((tag) => (
                <TagResultItem key={tag.id} tag={tag} onClick={onClose} />
              ))}
              type="tags"
              viewAllUrl={`${searchPageUrl}?q=${encodeURIComponent("")}&tab=tags`}
              onItemClick={onClose}
            />
          )}
        </>
      )}

      {/* No results */}
      {!isLoading && !hasResults && results && (
        <div className="py-8 text-center text-muted-foreground">
          <p>No results found</p>
        </div>
      )}

      {/* Footer with search page link */}
      <div className="border-t p-3 bg-muted/30">
        <Link
          href={searchPageUrl}
          className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
          onClick={onClose}
        >
          <span>Advanced Search</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
