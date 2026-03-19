"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  postFormSchema,
  PostFormData,
  defaultPostFormValues,
} from "../schemas/post-form.schema";
import { createPost, createTopicPost, updatePost } from "@/lib/apis/social";
import { uploadMedia } from "@/lib/apis/media";
import type { PostDetailResponse } from "@/lib/social/types";

// Allowed image types and max size (5MB)
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface UsePostFormReturn {
  /** React Hook Form methods */
  form: UseFormReturn<PostFormData>;
  /** Submit the form */
  submit: () => Promise<void>;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Whether cover image is uploading */
  isUploadingCover: boolean;
  /** Whether the form is valid and ready to submit */
  isValid: boolean;
  /** Handle cover image file selection */
  handleCoverSelect: (file: File) => Promise<void>;
  /** Handle cover image removal */
  handleCoverRemove: () => void;
  /** Get preview URL for cover image */
  coverPreviewUrl: string | null;
  /** Reset form to default values */
  resetForm: () => void;
}

interface UsePostFormOptions {
  postId?: string;
  initialPost?: PostDetailResponse | null;
}

/**
 * Custom hook for managing post creation form
 * Combines React Hook Form with Zod validation and API submission
 */
export function usePostForm({
  postId,
  initialPost,
}: UsePostFormOptions = {}): UsePostFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverServerUrl, setCoverServerUrl] = useState<string | null>(null);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: defaultPostFormValues,
    mode: "onChange", // Validate on change for better UX
  });

  const isEditIntent = Boolean(postId);
  const isEditMode = Boolean(postId && initialPost);

  useEffect(() => {
    if (!initialPost) {
      form.reset(defaultPostFormValues);
      setCoverFile(null);
      setCoverServerUrl(null);
      return;
    }

    form.reset({
      ...defaultPostFormValues,
      title: initialPost.title ?? "",
      content: initialPost.content ?? "",
      caption: initialPost.caption ?? "",
      visibility: initialPost.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      tags: initialPost.tags ?? [],
      coverServerUrl:
        initialPost.cover && initialPost.cover !== "default"
          ? initialPost.cover
          : undefined,
      isPasswordProtected: initialPost.locked,
      password: undefined,
    });

    setCoverFile(null);
    setCoverServerUrl(
      initialPost.cover && initialPost.cover !== "default"
        ? initialPost.cover
        : null,
    );
  }, [initialPost, form]);

  // Derive preview URL from either a newly selected file or the existing server URL
  const coverPreviewUrl = useMemo(() => {
    if (coverFile) {
      return URL.createObjectURL(coverFile);
    }
    return coverServerUrl;
  }, [coverFile, coverServerUrl]);

  // Check form validity (excluding cover upload state)
  const isValid = form.formState.isValid && !isSubmitting && !isUploadingCover;

  // Handle cover image file selection
  const handleCoverSelect = useCallback(
    async (file: File) => {
      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Invalid file type. Please upload JPG, PNG, WebP, or GIF.");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large. Maximum size is 5MB.");
        return;
      }

      // Clear previous server URL if exists
      setCoverServerUrl(null);
      setCoverFile(file);

      // Start background upload
      setIsUploadingCover(true);
      try {
        const response = await uploadMedia(file);
        setCoverServerUrl(response.url);
        form.setValue("coverServerUrl", response.url);
      } catch (error) {
        console.error("Cover upload failed:", error);
        toast.error("Failed to upload cover image");
        // Clear the file on upload failure
        setCoverFile(null);
      } finally {
        setIsUploadingCover(false);
      }
    },
    [form],
  );

  // Handle cover image removal
  const handleCoverRemove = useCallback(() => {
    setCoverFile(null);
    setCoverServerUrl(null);
    form.setValue("cover", undefined);
    form.setValue("coverServerUrl", undefined);
  }, [form]);

  // Reset form
  const resetForm = useCallback(() => {
    form.reset(defaultPostFormValues);
    setCoverFile(null);
    setCoverServerUrl(null);
  }, [form]);

  // Submit handler
  const submit = useCallback(async () => {
    // Trigger validation
    const isValidForm = await form.trigger();
    if (!isValidForm) {
      const errors = form.formState.errors;
      // Show first error as toast
      const firstError = Object.values(errors)[0];
      if (firstError && typeof firstError.message === "string") {
        toast.error(firstError.message);
      }
      return;
    }

    // Check if cover is still uploading
    if (isUploadingCover) {
      toast.error("Cover image is still uploading. Please wait.");
      return;
    }

    const formData = form.getValues();
    setIsSubmitting(true);

    try {
      if (isEditIntent && !initialPost) {
        toast.error("Unable to load the post for editing.");
        return;
      }

      const createPayload = {
        title: formData.title.trim(),
        caption: formData.caption.trim(),
        content: formData.content?.trim() || "",
        visibility: formData.visibility,
        tags: formData.tags,
        cover: coverServerUrl || "default",
        password: formData.isPasswordProtected ? formData.password : undefined,
      };

      if (isEditMode && postId && initialPost) {
        const updatePayload = {
          title: formData.title.trim(),
          caption: formData.caption.trim(),
          visibility: formData.visibility,
          tags: formData.tags,
          cover: coverServerUrl || "default",
          ...(initialPost.locked
            ? {}
            : { content: formData.content?.trim() || "" }),
        };

        await updatePost(postId, updatePayload);
        toast.success("Post updated successfully!");
      } else if (
        formData.postType === "community" &&
        formData.selectedCommunityId
      ) {
        await createTopicPost(formData.selectedCommunityId, createPayload);
        toast.success("Post created successfully!");
      } else {
        await createPost(createPayload);
        toast.success("Post created successfully!");
      }

      if (!isEditMode) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to submit post:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit post";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    form,
    isUploadingCover,
    coverServerUrl,
    initialPost,
    isEditIntent,
    isEditMode,
    postId,
    resetForm,
  ]);

  return {
    form,
    submit,
    isSubmitting,
    isUploadingCover,
    isValid,
    handleCoverSelect,
    handleCoverRemove,
    coverPreviewUrl,
    resetForm,
  };
}
