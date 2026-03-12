/**
 * Tab Filter Component
 *
 * A responsive tab component for filtering search results by entity type.
 * Supports: All, Users, Posts, Topics, Tags
 */

"use client";

import { SearchEntityType, SEARCH_TABS } from "../types/unified-search";

interface TabFilterProps {
  /** Currently active tab */
  activeTab: SearchEntityType;
  /** Callback when tab changes */
  onTabChange: (tab: SearchEntityType) => void;
  /** Result counts for each tab */
  counts?: {
    users: number;
    posts: number;
    topics: number;
    tags: number;
  };
  /** Whether tabs are disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Tab filter with counts
 */
export function TabFilter({
  activeTab,
  onTabChange,
  counts,
  disabled = false,
  className = "",
}: TabFilterProps) {
  const getCount = (tabId: SearchEntityType): number | undefined => {
    if (!counts) return undefined;
    switch (tabId) {
      case "all":
        return counts.users + counts.posts + counts.topics + counts.tags;
      case "users":
        return counts.users;
      case "posts":
        return counts.posts;
      case "topics":
        return counts.topics;
      case "tags":
        return counts.tags;
    }
  };

  return (
    <div
      className={`flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide ${className}`}
      role="tablist"
      aria-label="Search filters"
    >
      {SEARCH_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = getCount(tab.id);
        const hasCount = count !== undefined && count > 0;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => !disabled && onTabChange(tab.id)}
            disabled={disabled}
            className={`
              flex items-center gap-2
              px-3 py-2
              rounded-lg
              text-sm font-medium
              whitespace-nowrap
              transition-all
              duration-200
              ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>

            {/* Count badge */}
            {hasCount && (
              <span
                className={`
                  px-1.5 py-0.5
                  rounded-full
                  text-xs
                  ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }
                `}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Mobile-friendly compact tab filter
 * Shows as dropdown on small screens
 */
export function TabFilterCompact({
  activeTab,
  onTabChange,
  counts,
  disabled = false,
  className = "",
}: TabFilterProps) {
  const currentTab = SEARCH_TABS.find((t) => t.id === activeTab);
  const totalCount = counts
    ? counts.users + counts.posts + counts.topics + counts.tags
    : 0;

  return (
    <div className={`relative ${className}`}>
      {/* Desktop: Horizontal tabs */}
      <div className="hidden md:flex">
        <TabFilter
          activeTab={activeTab}
          onTabChange={onTabChange}
          counts={counts}
          disabled={disabled}
        />
      </div>

      {/* Mobile: Single button showing current filter */}
      <button
        className="
          md:hidden
          flex items-center gap-2
          w-full
          px-4 py-3
          rounded-lg
          border
          bg-background
          text-sm font-medium
          hover:bg-muted
          transition-colors
        "
        disabled={disabled}
      >
        <span className="text-base">{currentTab?.icon}</span>
        <span>{currentTab?.label}</span>
        {totalCount > 0 && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-xs">
            {totalCount}
          </span>
        )}
      </button>
    </div>
  );
}
