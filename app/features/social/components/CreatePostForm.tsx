"use client";

import { UseFormReturn } from "react-hook-form";
import { LexkitEditor } from "@/components/richtext/LexkitEditor";
import { PostFormData } from "../schemas/post-form.schema";

interface CreatePostFormProps {
  /** React Hook Form instance */
  form: UseFormReturn<PostFormData>;
}

export function CreatePostForm({ form }: CreatePostFormProps) {
  const {
    setValue,
    formState: { errors },
  } = form;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Create post</h2>
        <button
          type="button"
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Drafts
        </button>
      </div>

      <div className="mb-4 border-b border-slate-200">
        <div className="flex gap-6 text-sm font-medium">
          <button className="relative pb-3 text-slate-900">
            Text
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-slate-900" />
          </button>
        </div>
      </div>

      {/* Editor container - uses flex-col to properly constrain LexkitEditor height */}
      <div className="min-h-0 flex-1 max-h-[520px] flex flex-col">
        {/* Content Editor - h-full ensures it fills the constrained container */}
        <LexkitEditor
          placeholder="Body text (optional)"
          className="flex-1 min-h-0 relative flex flex-col rounded-lg border  pb-3 border-slate-200 bg-white"
          onChange={(value) =>
            setValue("content", value, { shouldValidate: true })
          }
        />
        {errors.content && (
          <p className="mt-2 shrink-0 text-xs text-red-500">
            {errors.content.message}
          </p>
        )}
      </div>
    </div>
  );
}
