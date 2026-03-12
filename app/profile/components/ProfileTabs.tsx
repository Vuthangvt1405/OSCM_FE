"use client";

import { useState } from "react";
import { FileText, MessageSquare, Bookmark, User } from "lucide-react";
import type { ProfileTab } from "@/lib/social/types";

export type ProfileTabsProps = {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  isOwnProfile?: boolean;
};

const tabs: { id: ProfileTab; label: string; icon: typeof FileText }[] = [
  { id: "posts", label: "Posts", icon: FileText },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "about", label: "About", icon: User },
];

export function ProfileTabs({
  activeTab,
  onTabChange,
  isOwnProfile = true,
}: ProfileTabsProps) {
  // Hide "Saved" tab for other users' profiles
  const visibleTabs = isOwnProfile
    ? tabs
    : tabs.filter((tab) => tab.id !== "saved");

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex overflow-x-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
