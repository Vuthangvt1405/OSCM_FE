"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  uploadAvatar,
  uploadCover,
  updateCurrentUser,
  CurrentUserResponse,
} from "@/lib/apis/social";

type EditProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: CurrentUserResponse | null;
  onSave: (profile: CurrentUserResponse) => void;
};

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  onSave,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Track if we're in the middle of an upload to prevent state reset
  const isUploadingRef = useRef(false);

  // Initialize form when profile changes (but not during upload)
  useEffect(() => {
    // Don't reset state during upload operations
    if (isUploadingRef.current) {
      return;
    }
    if (profile) {
      setDisplayName(profile.displayName);
      setBio(profile.bio || "");
      setAvatarUrl(profile.profilePictureUrl);
      setCoverUrl(profile.coverPictureUrl);
    }
  }, [profile]);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    isUploadingRef.current = true;
    setError(null);

    try {
      const updatedProfile = await uploadAvatar(file);
      setAvatarUrl(updatedProfile.profilePictureUrl);
      onSave(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      // Delay resetting the ref to allow the useEffect to skip
      setTimeout(() => {
        isUploadingRef.current = false;
      }, 100);
    }

    // Reset input
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    isUploadingRef.current = true;
    setError(null);

    try {
      const updatedProfile = await uploadCover(file);
      setCoverUrl(updatedProfile.coverPictureUrl);
      onSave(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cover");
    } finally {
      setIsUploadingCover(false);
      // Delay resetting the ref to allow the useEffect to skip
      setTimeout(() => {
        isUploadingRef.current = false;
      }, 100);
    }

    // Reset input
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedProfile = await updateCurrentUser({
        displayName,
        bio,
        profilePictureUrl: avatarUrl || undefined,
        coverPictureUrl: coverUrl || undefined,
      });
      onSave(updatedProfile);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Cover Image */}
          <div className="relative">
            <div
              className="relative h-32 w-full rounded-lg overflow-hidden cursor-pointer group"
              onClick={handleCoverClick}
            >
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingCover ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <div className="flex flex-col items-center text-white">
                    <Camera className="h-6 w-6" />
                    <span className="text-sm mt-1">Change Cover</span>
                  </div>
                )}
              </div>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>

          {/* Avatar */}
          <div className="relative -mt-16 ml-4">
            <div
              className="relative h-24 w-24 cursor-pointer group"
              onClick={handleAvatarClick}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="h-full w-full rounded-full border-4 border-white object-cover shadow-lg dark:border-slate-800"
                />
              ) : (
                <div className="grid h-full w-full place-items-center rounded-full border-4 border-white bg-slate-800 text-2xl font-bold text-white shadow-lg dark:border-slate-800">
                  {displayName ? getInitials(displayName) : "?"}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label>Bio</Label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-slate-200 bg-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              maxLength={500}
            />
            <p className="text-xs text-slate-500 text-right">
              {bio.length}/500
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            className="bg-orange-500 text-white hover:bg-orange-600"
            onClick={handleSave}
            disabled={isSaving || isUploadingAvatar || isUploadingCover}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
