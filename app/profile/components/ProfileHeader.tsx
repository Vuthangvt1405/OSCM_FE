"use client";

import Image from "next/image";
import type { UserProfile } from "@/lib/social/types";
import { Settings, Share2, Calendar, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ProfileHeaderProps = {
  profile: UserProfile;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
};

function formatJoinDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${month} ${year}`;
}

function formatCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }
  return count.toString();
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileHeader({
  profile,
  isOwnProfile = true,
  onEditProfile,
}: ProfileHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {/* Cover Image */}
      <div className="relative h-40 w-full sm:h-48 md:h-56">
        {profile.coverUrl ? (
          <Image
            src={profile.coverUrl}
            alt={`${profile.displayName} cover`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
        )}
        {/* Overlay gradient for better avatar visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Profile Info Section */}
      <div className="relative px-6 pb-6 pt-16 sm:pt-10">
        {/* Avatar - Positioned to overlap cover image */}
        <div className="absolute -top-12 left-6 sm:-top-14">
          <div className="relative shrink-0">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={`${profile.displayName} avatar`}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg dark:border-slate-800 sm:h-28 sm:w-28"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-white bg-slate-800 text-2xl font-bold text-white shadow-lg dark:border-slate-800 sm:h-28 sm:w-28 sm:text-3xl">
                {getInitials(profile.displayName)}
              </div>
            )}
            {profile.isOnline && (
              <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white bg-green-500 dark:border-slate-800" />
            )}
          </div>
        </div>

        {/* Action Buttons - Positioned in top right */}
        <div className="flex flex-wrap justify-end gap-2">
          {isOwnProfile ? (
            <>
              <Button
                className="gap-2 bg-orange-500 text-white hover:bg-orange-600"
                size="sm"
              >
                <Settings className="h-4 w-4" />
                Manage Posts
              </Button>
              <Button
                variant="outline"
                className="border-slate-200 dark:border-slate-600"
                size="sm"
                onClick={onEditProfile}
              >
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-200 dark:border-slate-600"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                className="gap-2 bg-orange-500 text-white hover:bg-orange-600"
                size="sm"
              >
                <UserPlus className="h-4 w-4" />
                Follow
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-200 dark:border-slate-600"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* User Info */}
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {profile.displayName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            @{profile.username}
          </p>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatCount(profile.followersCount)}
              </span>{" "}
              Followers
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatCount(profile.followingCount)}
              </span>{" "}
              Following
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {formatJoinDate(profile.joinedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
