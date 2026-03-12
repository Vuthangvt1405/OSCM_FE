"use client";

import { useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Lock,
  Eye,
  Globe,
  Users,
  X,
  ChevronsUpDown,
  Loader2,
  ImagePlus,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { PostFormData } from "../schemas/post-form.schema";
import { CommunityOption } from "../hooks/useCommunitySearch";
import { TagOption } from "../hooks/useTagSearch";

// Allowed image types and max size (5MB)
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface PostOptionsPanelProps {
  /** React Hook Form instance */
  form: UseFormReturn<PostFormData>;
  /** Community search state */
  communitySearch: {
    communities: CommunityOption[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isSearching: boolean;
  };
  /** Tag search state */
  tagSearch: {
    tagSuggestions: TagOption[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isSearching: boolean;
  };
  /** Cover image preview URL */
  coverPreviewUrl: string | null;
  /** Whether cover is uploading */
  isUploadingCover: boolean;
  /** Handle cover file selection */
  onCoverSelect: (file: File) => void;
  /** Handle cover removal */
  onCoverRemove: () => void;
}

export function PostOptionsPanel({
  form,
  communitySearch,
  tagSearch,
  coverPreviewUrl,
  isUploadingCover,
  onCoverSelect,
  onCoverRemove,
}: PostOptionsPanelProps) {
  const { watch, setValue, formState } = form;
  const { communities, searchQuery, setSearchQuery, isSearching } =
    communitySearch;
  const {
    tagSuggestions,
    searchQuery: tagSearchQuery,
    setSearchQuery: setTagSearchQuery,
    isSearching: isSearchingTags,
  } = tagSearch;

  // Form values
  const title = watch("title");
  const caption = watch("caption");
  const postType = watch("postType");
  const selectedCommunityId = watch("selectedCommunityId");
  const visibility = watch("visibility");
  const tags = watch("tags");
  const isPasswordProtected = watch("isPasswordProtected");
  const password = watch("password");

  // Local UI state
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [pendingPassword, setPendingPassword] = useState("");
  const [communityPopoverOpen, setCommunityPopoverOpen] = useState(false);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // File input ref for cover upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password handlers
  const handlePasswordToggle = () => {
    if (!isPasswordProtected) {
      setShowPasswordConfirm(true);
    } else {
      setValue("isPasswordProtected", false);
      setValue("password", undefined);
    }
  };

  const handleConfirmPassword = () => {
    if (pendingPassword.length < 8) return;
    setValue("isPasswordProtected", true);
    setValue("password", pendingPassword);
    setShowPasswordConfirm(false);
    setPendingPassword("");
  };

  const handleCancelPassword = () => {
    setShowPasswordConfirm(false);
    setPendingPassword("");
  };

  // Community selection
  const selectedCommunity = communities.find(
    (c) => c.id === selectedCommunityId,
  );

  // Tag handlers
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setValue("tags", tags.slice(0, -1));
    }
  };

  const addTag = () => {
    const trimmedInput = tagInput.trim();
    if (trimmedInput) {
      const tagName = trimmedInput.replace(/_/g, " ");
      if (!tags.includes(tagName)) {
        setValue("tags", [...tags, tagName]);
      }
      setTagInput("");
      setTagSearchQuery("");
      setTagPopoverOpen(false);
    }
  };

  const selectTagSuggestion = (tagName: string) => {
    if (!tags.includes(tagName)) {
      setValue("tags", [...tags, tagName]);
    }
    setTagInput("");
    setTagSearchQuery("");
    setTagPopoverOpen(false);
  };

  const handleTagInputChange = (inputValue: string) => {
    setTagInput(inputValue);
    setTagSearchQuery(inputValue);
  };

  const removeTag = (index: number) => {
    setValue(
      "tags",
      tags.filter((_, i) => i !== index),
    );
  };

  // Cover upload handlers
  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return; // Validation handled by parent hook
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return; // Validation handled by parent hook
    }

    onCoverSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow re-selecting same file
    e.target.value = "";
  };

  return (
    <div className="space-y-8">
      {/* Title Section */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-slate-900">Title</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Required</span>
            <span>{title?.length || 0}/150</span>
          </div>
          <Input
            placeholder="Enter post title..."
            value={title}
            onChange={(e) =>
              setValue("title", e.target.value, { shouldValidate: true })
            }
            maxLength={150}
          />
          {formState.errors.title && (
            <p className="text-xs text-red-500">
              {formState.errors.title.message}
            </p>
          )}
        </div>
      </section>

      {/* Cover Image Section */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-slate-900">
          Cover Image
        </h3>
        <div className="w-full">
          {coverPreviewUrl ? (
            // Preview State - Show uploaded image
            <div className="group relative w-full overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverPreviewUrl}
                alt="Cover preview"
                className="h-auto w-full max-h-80 object-cover"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {isUploadingCover ? (
                  <div className="flex items-center gap-2 text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onCoverRemove}
                    className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>

              {/* Uploading indicator (always visible when uploading) */}
              {isUploadingCover && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
          ) : (
            // Empty State - Upload frame
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-8 transition-colors hover:border-slate-400 hover:bg-slate-100"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                  <ImagePlus className="h-6 w-6 text-slate-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Add Cover Image
                  </p>
                  <p className="text-xs text-slate-500">Click or drag & drop</p>
                </div>
                <p className="text-xs text-slate-400">
                  JPG, PNG, WebP, GIF • Max 5MB
                </p>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      </section>

      {/* Caption Section */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-slate-900">Caption</h3>
        <div className="space-y-2">
          <Input
            placeholder="Add a short description..."
            value={caption}
            onChange={(e) => setValue("caption", e.target.value)}
            maxLength={200}
          />
          <div className="flex justify-end text-xs text-slate-500">
            <span>{caption?.length || 0}/200</span>
          </div>
        </div>
      </section>

      {/* Post Type Section */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-slate-900">
          Post Type
        </h3>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setValue("postType", "normal");
              setValue("selectedCommunityId", undefined);
            }}
            className={`group flex w-full items-center gap-3 rounded-lg border p-3 transition-all duration-200 ${
              postType === "normal"
                ? "border-sky-400 bg-sky-50 shadow-sm shadow-sky-100"
                : "border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 hover:shadow-sm hover:shadow-sky-50"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                postType === "normal"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-600"
              }`}
            >
              <Globe className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-900">
                Normal Post
              </div>
              <div className="text-xs text-slate-500">
                Share with your followers
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setValue("postType", "community")}
            className={`group flex w-full items-center gap-3 rounded-lg border p-3 transition-all duration-200 ${
              postType === "community"
                ? "border-purple-400 bg-purple-50 shadow-sm shadow-purple-100"
                : "border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-sm hover:shadow-purple-50"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                postType === "community"
                  ? "bg-purple-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-600"
              }`}
            >
              <Users className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-900">
                Community Topic
              </div>
              <div className="text-xs text-slate-500">
                Post to a specific community
              </div>
            </div>
          </button>
        </div>

        {/* Community Selection */}
        {postType === "community" && (
          <div className="mt-3">
            <Popover
              open={communityPopoverOpen}
              onOpenChange={setCommunityPopoverOpen}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <span className="text-left">
                    {selectedCommunity
                      ? selectedCommunity.name
                      : "Select a community"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search communities..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    {isSearching ? (
                      <div className="flex items-center justify-center py-6 text-sm text-slate-500">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </div>
                    ) : communities.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-500">
                        {searchQuery.trim()
                          ? "No communities found."
                          : "No communities available."}
                      </div>
                    ) : (
                      <CommandGroup>
                        {communities.map((community) => (
                          <CommandItem
                            key={community.id}
                            onSelect={() => {
                              setValue("selectedCommunityId", community.id);
                              setCommunityPopoverOpen(false);
                              setSearchQuery("");
                            }}
                          >
                            {community.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {formState.errors.selectedCommunityId && (
              <p className="mt-1 text-xs text-red-500">
                {formState.errors.selectedCommunityId.message}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Tags Section */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-slate-900">Tags</h3>
        <div className="space-y-3">
          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="group flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all duration-200 hover:border-violet-300 hover:shadow-sm hover:shadow-violet-50 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <span
                  className={
                    tags.length > 0 ? "text-slate-900" : "text-slate-500"
                  }
                >
                  {tags.length > 0
                    ? `${tags.length} tag${tags.length > 1 ? "s" : ""} selected`
                    : "Add tags..."}
                </span>
                <ChevronsUpDown className="h-4 w-4 text-slate-400 transition-colors group-hover:text-violet-500" />
              </button>
            </PopoverTrigger>

            <PopoverContent className="p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search or add tags..."
                  value={tagInput}
                  onValueChange={handleTagInputChange}
                  onKeyDown={handleTagKeyDown}
                />
                <CommandList>
                  {isSearchingTags ? (
                    <div className="flex items-center justify-center py-6 text-sm text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </div>
                  ) : tagSuggestions.length === 0 ? (
                    tagInput.trim() ? (
                      <div className="py-6 text-center text-sm text-slate-500">
                        {`No matching tags. Press Enter to create "${tagInput.trim()}"`}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm text-slate-500">
                        Start typing to search tags...
                      </div>
                    )
                  ) : (
                    <CommandGroup heading="Suggestions">
                      {tagSuggestions.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => selectTagSuggestion(tag.name)}
                          disabled={tags.includes(tag.name)}
                        >
                          <span
                            className={
                              tags.includes(tag.name) ? "text-slate-400" : ""
                            }
                          >
                            {tag.name}
                          </span>
                          {tags.includes(tag.name) && (
                            <span className="ml-auto text-xs text-slate-400">
                              Added
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Tag List */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-800 transition-colors hover:bg-violet-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 text-violet-500 transition-colors hover:text-violet-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500">
            Search existing tags or type new ones. Press Space or Enter to add.
          </p>
        </div>
      </section>

      {/* Visibility Section */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-slate-900">
          Visibility
        </h3>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setValue("visibility", "PUBLIC")}
            className={`group flex w-full items-center gap-3 rounded-lg border p-3 transition-all duration-200 ${
              visibility === "PUBLIC"
                ? "border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100"
                : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm hover:shadow-emerald-50"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                visibility === "PUBLIC"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-600"
              }`}
            >
              <Globe className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-900">Public</div>
              <div className="text-xs text-slate-500">
                Anyone can see this post
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setValue("visibility", "PRIVATE")}
            className={`group flex w-full items-center gap-3 rounded-lg border p-3 transition-all duration-200 ${
              visibility === "PRIVATE"
                ? "border-amber-400 bg-amber-50 shadow-sm shadow-amber-100"
                : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-sm hover:shadow-amber-50"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                visibility === "PRIVATE"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-600"
              }`}
            >
              <Eye className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-900">Private</div>
              <div className="text-xs text-slate-500">
                Only you can see this post
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Password Protection Section */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-slate-900">
          Access Control
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">
                  Password Protection
                </div>
                <div className="text-xs text-slate-500">
                  Require a password to view this post
                </div>
              </div>
            </div>
            <Switch
              checked={isPasswordProtected}
              onCheckedChange={handlePasswordToggle}
            />
          </div>

          {isPasswordProtected && (
            <div className="ml-11 space-y-2">
              <Label>
                Password
                <Input
                  type="password"
                  value={password || ""}
                  onChange={(e) => setValue("password", e.target.value)}
                  placeholder="Enter password (min 8 characters)"
                  className="mt-1"
                />
              </Label>
              <p className="text-xs text-slate-500">
                This password will be required to view your post.
              </p>
              {formState.errors.password && (
                <p className="text-xs text-red-500">
                  {formState.errors.password.message}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Password Confirmation Dialog */}
      {showPasswordConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Enable Password Protection
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Set a password that viewers will need to enter to see your post.
            </p>
            <div className="mt-4 space-y-2">
              <Label>
                Password (min 8 characters)
                <Input
                  type="password"
                  value={pendingPassword}
                  onChange={(e) => setPendingPassword(e.target.value)}
                  placeholder="Enter password"
                  className="mt-1"
                />
              </Label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelPassword}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPassword}
                disabled={pendingPassword.length < 8}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
