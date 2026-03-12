"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  HeadingNode,
  QuoteNode,
  $isQuoteNode,
  $createQuoteNode,
  $createHeadingNode,
  $isHeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import {
  ListItemNode,
  ListNode,
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode } from "@lexical/code";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $setBlocksType } from "@lexical/selection";
import { ImageNode } from "./nodes/ImageNode";
import ImagesPlugin, { INSERT_IMAGE_COMMAND } from "./plugins/ImagesPlugin";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  EditorState,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  LexicalNode,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  $getRoot,
  ElementFormatType,
  $isElementNode,
} from "lexical";
import {
  $createHorizontalRuleNode,
  HorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode";
import { mergeRegister, $insertNodeToNearestRoot } from "@lexical/utils";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Undo,
  Redo,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  CheckSquare,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
} from "lucide-react";

const theme = {
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "rounded bg-slate-100 px-1 font-mono text-[0.85em]",
  },
  list: {
    ol: "list-decimal pl-6",
    ul: "list-disc pl-6",
    listitem: "my-1",
    listitemChecked: "list-none before:content-['☑️'] before:mr-2",
    listitemUnchecked: "list-none before:content-['⬜'] before:mr-2",
  },
  quote: "border-l-4 border-slate-200 pl-3 text-slate-600 italic",
  heading: {
    h1: "text-2xl font-semibold",
    h2: "text-xl font-semibold",
    h3: "text-lg font-semibold",
  },
};

const editorConfig = {
  namespace: "OdysseusEditor",
  theme,
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    AutoLinkNode,
    CodeNode,
    ImageNode,
    HorizontalRuleNode,
  ],
  onError(error: Error) {
    throw error;
  },
};

export type LexkitEditorProps = {
  placeholder?: string;
  className?: string;
  onChange?: (markdown: string) => void;
  maxLength?: number;
};

// Block type for dropdown
type BlockType = "paragraph" | "h1" | "h2" | "h3" | "quote";

const blockTypeToBlockName: Record<BlockType, string> = {
  paragraph: "Normal",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  quote: "Quote",
};

// URL matcher for AutoLinkPlugin
const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text);
    if (match === null) {
      return null;
    }
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith("http") ? fullMatch : `https://${fullMatch}`,
    };
  },
];

function ToolbarPlugin({
  onInsertImage,
  maxLength,
}: {
  onInsertImage: () => void;
  maxLength?: number;
}) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isQuote, setIsQuote] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);
  const [isCheckList, setIsCheckList] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>("paragraph");
  const [alignment, setAlignment] = useState<
    "left" | "center" | "right" | "justify"
  >("left");
  const [characterCount, setCharacterCount] = useState(0);
  const [showBlockDropdown, setShowBlockDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowBlockDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat("bold"));
    setIsItalic(selection.hasFormat("italic"));
    setIsUnderline(selection.hasFormat("underline"));
    setIsStrikethrough(selection.hasFormat("strikethrough"));
    setIsCode(selection.hasFormat("code"));

    const anchorNode = selection.anchor.getNode();

    // Check block type (heading, quote, paragraph)
    let current: LexicalNode | null = anchorNode;
    let newBlockType: BlockType = "paragraph";

    while (current) {
      if ($isHeadingNode(current)) {
        const tag = current.getTag();
        if (tag === "h1") newBlockType = "h1";
        else if (tag === "h2") newBlockType = "h2";
        else if (tag === "h3") newBlockType = "h3";
        break;
      }
      if ($isQuoteNode(current)) {
        newBlockType = "quote";
        break;
      }
      current = current.getParent();
    }
    setBlockType(newBlockType);

    // Check list types
    let listType: string | null = null;
    current = anchorNode;
    while (current) {
      if ($isListNode(current)) {
        listType = current.getListType();
        break;
      }
      current = current.getParent();
    }

    setIsBulletList(listType === "bullet");
    setIsNumberedList(listType === "number");
    setIsCheckList(listType === "check");

    // Check quote
    let quoteActive = false;
    current = anchorNode;
    while (current) {
      if ($isQuoteNode(current)) {
        quoteActive = true;
        break;
      }
      current = current.getParent();
    }
    setIsQuote(quoteActive);

    // Check alignment from the block element (paragraph, heading, quote)
    // Alignment is stored on the block element via getFormatType()
    // getFormatType() returns: "left", "center", "right", "justify"
    const parentBlock = anchorNode.getParent();
    if (parentBlock !== null && $isElementNode(parentBlock)) {
      const formatType = parentBlock.getFormatType();
      if (
        formatType === "left" ||
        formatType === "center" ||
        formatType === "right" ||
        formatType === "justify"
      ) {
        setAlignment(formatType);
      } else {
        setAlignment("left"); // Default
      }
    }

    // Update character count
    const textContent = $getRoot().getTextContent();
    setCharacterCount(textContent.length);
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(updateToolbar);
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        1,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        1,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        1,
      ),
    );
  }, [editor, updateToolbar]);

  const formatHeading = (headingType: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $setBlocksType(selection, () => $createHeadingNode(headingType));
    });
    setShowBlockDropdown(false);
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $setBlocksType(selection, () => $createParagraphNode());
    });
    setShowBlockDropdown(false);
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $setBlocksType(selection, () =>
        isQuote ? $createParagraphNode() : $createQuoteNode(),
      );
    });
  };

  const toggleList = (type: "bullet" | "number" | "check") => {
    if (type === "bullet") {
      editor.dispatchCommand(
        isBulletList ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
        undefined,
      );
      return;
    }
    if (type === "number") {
      editor.dispatchCommand(
        isNumberedList ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
        undefined,
      );
      return;
    }
    // Check list
    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
  };

  const formatAlignment = (align: ElementFormatType) => {
    // Use FORMAT_ELEMENT_COMMAND for block-level alignment
    // This is the correct Lexical API for text alignment
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);
  };

  const insertHorizontalRule = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const hr = $createHorizontalRuleNode();
      $insertNodeToNearestRoot(hr);
    });
  };

  const isOverLimit = maxLength !== undefined && characterCount > maxLength;

  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-3 py-2 text-slate-500"
      onMouseDown={(event) => event.preventDefault()}
    >
      {/* Block Type Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowBlockDropdown(!showBlockDropdown)}
          className="inline-flex h-7 items-center gap-1 rounded px-2 text-sm font-medium hover:bg-slate-100"
        >
          {blockTypeToBlockName[blockType]}
          <ChevronDown className="h-3 w-3" />
        </button>
        {showBlockDropdown && (
          <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={formatParagraph}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100 ${
                blockType === "paragraph" ? "bg-slate-50 text-slate-900" : ""
              }`}
            >
              <Pilcrow className="h-3.5 w-3.5" />
              Normal
            </button>
            <button
              type="button"
              onClick={() => formatHeading("h1")}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100 ${
                blockType === "h1" ? "bg-slate-50 text-slate-900" : ""
              }`}
            >
              <Heading1 className="h-3.5 w-3.5" />
              Heading 1
            </button>
            <button
              type="button"
              onClick={() => formatHeading("h2")}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100 ${
                blockType === "h2" ? "bg-slate-50 text-slate-900" : ""
              }`}
            >
              <Heading2 className="h-3.5 w-3.5" />
              Heading 2
            </button>
            <button
              type="button"
              onClick={() => formatHeading("h3")}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100 ${
                blockType === "h3" ? "bg-slate-50 text-slate-900" : ""
              }`}
            >
              <Heading3 className="h-3.5 w-3.5" />
              Heading 3
            </button>
            <button
              type="button"
              onClick={() => {
                formatQuote();
                setShowBlockDropdown(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100 ${
                blockType === "quote" ? "bg-slate-50 text-slate-900" : ""
              }`}
            >
              <Quote className="h-3.5 w-3.5" />
              Quote
            </button>
          </div>
        )}
      </div>

      <div className="mx-1 h-4 w-px bg-slate-200" />

      {/* Text Formatting */}
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          isBold ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          isItalic ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          isUnderline ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Underline"
      >
        <Underline className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
        }
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          isStrikethrough ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          isCode ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Code"
      >
        <Code className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-4 w-px bg-slate-200" />

      {/* Text Alignment */}
      <button
        type="button"
        onClick={() => formatAlignment("left")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          alignment === "left" ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Align Left"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => formatAlignment("center")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          alignment === "center" ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Align Center"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => formatAlignment("right")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          alignment === "right" ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Align Right"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => formatAlignment("justify")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          alignment === "justify" ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Justify"
      >
        <AlignJustify className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-4 w-px bg-slate-200" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => toggleList("bullet")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          isBulletList ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => toggleList("number")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          isNumberedList ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Numbered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => toggleList("check")}
        className={`inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${
          isCheckList ? "bg-slate-100 text-slate-900" : ""
        }`}
        title="Checklist"
      >
        <CheckSquare className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-4 w-px bg-slate-200" />

      {/* Insert Elements */}
      <button
        type="button"
        onClick={insertHorizontalRule}
        className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100"
        title="Horizontal Rule"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onInsertImage}
        className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100"
        title="Insert Image"
      >
        <ImageIcon className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-4 w-px bg-slate-200" />

      {/* Undo/Redo */}
      <button
        type="button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={!canUndo}
        className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 disabled:opacity-40"
        title="Undo"
      >
        <Undo className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
        className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 disabled:opacity-40"
        title="Redo"
      >
        <Redo className="h-3.5 w-3.5" />
      </button>

      {/* Character Count */}
      {maxLength !== undefined && (
        <div className="ml-auto flex items-center">
          <span
            className={`text-xs ${
              isOverLimit
                ? "font-semibold text-red-500"
                : characterCount > maxLength * 0.9
                  ? "text-amber-500"
                  : "text-slate-400"
            }`}
          >
            {characterCount}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
}

function ImageUploadModal({ onClose }: { onClose: () => void }) {
  const [editor] = useLexicalComposerContext();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/social/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.error ||
            `Upload failed (${res.status})`,
        );
      }
      const data = await res.json();

      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: data.url,
        altText: file.name,
        showCaption: true,
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Upload Image
        </h3>
        <div className="flex flex-col items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-violet-50 file:text-violet-700
                hover:file:bg-violet-100"
          />
          {isUploading && (
            <p className="text-sm text-slate-500">Uploading...</p>
          )}
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function LexkitEditor({
  className,
  onChange,
  maxLength,
}: LexkitEditorProps) {
  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onChange?.(markdown);
      });
    },
    [onChange],
  );
  const [showImageModal, setShowImageModal] = useState(false);

  return (
    <div
      className={
        className ??
        "relative h-full flex flex-col rounded-lg border border-slate-200 bg-white"
      }
    >
      <LexicalComposer initialConfig={editorConfig}>
        <ToolbarPlugin
          onInsertImage={() => setShowImageModal(true)}
          maxLength={maxLength}
        />
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-4 text-sm text-black focus:outline-none" />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <ListPlugin />
        <LinkPlugin />
        <AutoLinkPlugin matchers={MATCHERS} />
        <CheckListPlugin />
        <TabIndentationPlugin />
        <ImagesPlugin />
        {showImageModal && (
          <ImageUploadModal onClose={() => setShowImageModal(false)} />
        )}
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin onChange={handleChange} />
      </LexicalComposer>
    </div>
  );
}
