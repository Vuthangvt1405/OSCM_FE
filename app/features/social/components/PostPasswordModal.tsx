"use client";

import { useState, useCallback } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlockPost } from "@/lib/apis/social";
import type { PostDetailResponse } from "@/lib/social/types";

interface PostPasswordModalProps {
  /** ID of the post to unlock */
  postId: string;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when post is successfully unlocked */
  onUnlock: (post: PostDetailResponse) => void;
}

/**
 * Modal dialog for entering password to unlock a protected post
 */
export function PostPasswordModal({
  postId,
  isOpen,
  onClose,
  onUnlock,
}: PostPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Reset state when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPassword("");
      setError(null);
      setShowPassword(false);
      onClose();
    }
  };

  // Clear error when user types
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unlockedPost = await unlockPost(postId, password);
      onUnlock(unlockedPost);
      toast.success("Post unlocked successfully");
      handleOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to unlock post";
      // Check for common error messages
      if (
        message.toLowerCase().includes("invalid") ||
        message.toLowerCase().includes("incorrect") ||
        message.toLowerCase().includes("wrong")
      ) {
        setError("Incorrect password. Please try again.");
        toast.error("Incorrect password. Please try again.");
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [postId, password, onUnlock]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Lock className="h-5 w-5 text-slate-600" />
            </div>
            <DialogTitle>Unlock Protected Post</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            This post is password protected. Enter the password below to unlock
            and view the content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="pr-10"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Inline error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Unlocking...
              </>
            ) : (
              "Unlock"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
