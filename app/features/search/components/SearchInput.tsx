/**
 * Search Input Component
 *
 * A responsive search input with:
 * - Clear button
 * - Search icon
 * - Loading state
 * - Keyboard shortcuts (press / to focus)
 */

"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Search, X, Loader2 } from "lucide-react";

export interface SearchInputHandle {
  focus: () => void;
  blur: () => void;
}

interface SearchInputProps {
  /** Current value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when search is submitted */
  onSubmit?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether search is loading */
  isLoading?: boolean;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Search input with icon, clear button, and loading state
 */
export const SearchInput = forwardRef<SearchInputHandle, SearchInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      placeholder = "Search...",
      isLoading = false,
      disabled = false,
      autoFocus = false,
      className = "",
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose focus/blur methods
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
    }));

    // Keyboard shortcut: press / to focus
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Don't trigger if user is typing in another input
        if (
          e.key === "/" &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        onSubmit?.();
      }
      if (e.key === "Escape") {
        onChange("");
        inputRef.current?.blur();
      }
    };

    const handleClear = () => {
      onChange("");
      inputRef.current?.focus();
    };

    return (
      <div className={`relative flex items-center w-full ${className}`}>
        {/* Search Icon */}
        <div className="absolute left-3 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="
          w-full
          h-12
          pl-10
          pr-10
          rounded-lg
          border
          border-input
          bg-background
          text-sm
          placeholder:text-muted-foreground
          focus:border
          focus:outline-none
          transition-colors
          duration-200
          outline-none
        "
        />

        {/* Clevalue && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Keyboard shortcut hint */}
        {!value && (
          <kbd className="absolute right-3 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">/</span>
          </kbd>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
