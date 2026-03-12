"use client";

import { z } from "zod";

/**
 * Post form validation schema using Zod
 * Handles all validation rules for creating/editing a post
 */
export const postFormSchema = z
  .object({
    // Title: required, 1-150 characters
    title: z
      .string()
      .min(1, "Title is required")
      .max(150, "Title must be less than 150 characters"),

    // Content: optional, but if provided must be 10-10000 characters
    content: z
      .string()
      .max(10000, "Content must be less than 10,000 characters")
      .optional()
      .refine(
        (val) => !val || val.trim().length === 0 || val.trim().length >= 10,
        {
          message: "Content must be at least 10 characters long",
        },
      ),

    // Caption: optional, max 200 characters
    caption: z.string().max(200, "Caption must be less than 200 characters"),

    // Post type: normal or community
    postType: z.enum(["normal", "community"]),

    // Selected community: required if postType is "community"
    selectedCommunityId: z.string().optional(),

    // Visibility: PUBLIC or PRIVATE
    visibility: z.enum(["PUBLIC", "PRIVATE"]),

    // Tags: array of strings
    tags: z.array(z.string()),

    // Password protection
    isPasswordProtected: z.boolean(),
    password: z.string().optional(),

    // Cover image: can be a File object or server URL string
    cover: z.any().optional(),
    coverServerUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      // If password protection is enabled, password must be at least 8 characters (matching backend)
      if (data.isPasswordProtected) {
        return !!data.password && data.password.length >= 8;
      }
      return true;
    },
    {
      message: "Password must be at least 8 characters",
      path: ["password"],
    },
  );

export type PostFormData = z.infer<typeof postFormSchema>;

/**
 * Default values for the post form
 */
export const defaultPostFormValues: PostFormData = {
  title: "",
  content: "",
  caption: "",
  postType: "normal",
  selectedCommunityId: undefined,
  visibility: "PUBLIC",
  tags: [],
  isPasswordProtected: false,
  password: undefined,
  cover: undefined,
  coverServerUrl: undefined,
};
