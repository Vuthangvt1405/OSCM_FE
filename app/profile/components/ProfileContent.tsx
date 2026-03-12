"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useSidebarAvailability } from "@/features/sidebar";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileTabs } from "./ProfileTabs";
import { UserPostList } from "./UserPostList";
import { ProfileRightSidebar } from "./ProfileRightSidebar";
import { EditProfileModal } from "./EditProfileModal";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchUserProfile,
  fetchUserStats,
  fetchUserPosts,
  getCurrentUser,
  UserProfileResponse,
  UserStatsResponse,
  BackendPostFeedItem,
  CurrentUserResponse,
} from "@/lib/apis/social";
import type {
  UserProfile,
  UserPost,
  ProfileTab,
  PostFilter,
} from "@/lib/social/types";

export function ProfileContent() {
  // Declare that this page has a sidebar (enables sidebar menu button in header)
  useSidebarAvailability();

  // Get userId from auth session
  const { session, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [posts, setPosts] = useState<BackendPostFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [postFilter, setPostFilter] = useState<PostFilter>("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<CurrentUserResponse | null>(null);

  const userId = session?.userId ?? null;

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [profileData, statsData, postsData] = await Promise.all([
          fetchUserProfile(userId),
          fetchUserStats(userId),
          fetchUserPosts({ userId, page: 0, size: 10 }),
        ]);
        setProfile(profileData);
        setStats(statsData);
        setPosts(postsData.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleEditProfile = async () => {
    try {
      const currentUserData = await getCurrentUser();
      setCurrentUserProfile(currentUserData);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error("Failed to load current user profile:", err);
    }
  };

  const handleSaveProfile = (updatedProfile: CurrentUserResponse) => {
    setCurrentUserProfile(updatedProfile);
    // Update profile state directly from the response for immediate UI update
    if (profile) {
      setProfile({
        ...profile,
        displayName: updatedProfile.displayName,
        bio: updatedProfile.bio,
        avatarUrl: updatedProfile.profilePictureUrl,
        coverUrl: updatedProfile.coverPictureUrl,
      });
    }
  };

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Please log in to view your profile
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = true; // This is the current user's profile

  // Transform API response to UserProfile type
  const userProfile: UserProfile | null = profile
    ? {
        id: profile.userId,
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl ?? undefined,
        coverUrl: profile.coverUrl ?? undefined,
        bio: profile.bio ?? undefined,
        followersCount: stats?.followersCount ?? 0,
        followingCount: stats?.followingCount ?? 0,
        joinedAt: profile.joinedAt ?? new Date().toISOString(),
        isOnline: true,
      }
    : null;

  // Transform posts to UserPost type
  const userPosts: UserPost[] = posts.map((post) => ({
    id: post.id,
    authorName: post.author?.username ?? "Unknown",
    title: post.title,
    caption: post.caption ?? undefined,
    score: (post.likeCount ?? 0) - (post.dislikeCount ?? 0),
    createdAtLabel: post.createdAt
      ? new Date(post.createdAt).toLocaleDateString()
      : "Unknown",
    likeCount: post.likeCount ?? 0,
    dislikeCount: post.dislikeCount ?? 0,
    userReaction: (post.myReaction as "LIKE" | "DISLIKE" | null) ?? null,
    visibility: "PUBLIC" as const,
    topic: undefined,
  }));

  return (
    <div className="flex flex-1 overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-6xl overflow-hidden px-4">
          <div className="box-border h-full py-8">
            <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[1fr_320px]">
              {/* Left Content */}
              <section className="h-full min-h-0 overflow-y-auto scrollbar-hidden">
                {/* Profile Header */}
                {userProfile && (
                  <ProfileHeader
                    profile={userProfile}
                    isOwnProfile={isOwnProfile}
                    onEditProfile={handleEditProfile}
                  />
                )}

                {/* Tabs */}
                <div className="mt-6">
                  <ProfileTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isOwnProfile={isOwnProfile}
                  />
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                  {activeTab === "posts" && (
                    <UserPostList
                      posts={userPosts}
                      filter={postFilter}
                      onFilterChange={setPostFilter}
                      isOwnProfile={isOwnProfile}
                    />
                  )}

                  {activeTab === "comments" && (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                      <p className="text-sm text-slate-500">
                        Comments feature coming soon
                      </p>
                    </div>
                  )}

                  {activeTab === "saved" && (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                      <p className="text-sm text-slate-500">
                        Saved posts will appear here
                      </p>
                    </div>
                  )}

                  {activeTab === "about" && profile && (
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                      <h3 className="text-lg font-bold text-slate-900">
                        About
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">
                        {profile.bio || "No bio yet"}
                      </p>
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <h4 className="text-sm font-medium text-slate-900">
                          Stats
                        </h4>
                        <div className="mt-2 text-sm text-slate-600">
                          <p>{stats?.postsCount ?? 0} posts</p>
                          <p>{stats?.totalLikes ?? 0} likes received</p>
                          <p>{stats?.totalDislikes ?? 0} dislikes received</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Right Sidebar */}
              <aside className="hidden h-full min-h-0 rounded-xl border border-slate-200 bg-white p-0 shadow-sm lg:block">
                <div className="scrollbar-hidden h-full min-h-0 overflow-y-auto p-6">
                  <ProfileRightSidebar newFollowers={[]} topTags={[]} />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        profile={currentUserProfile}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
