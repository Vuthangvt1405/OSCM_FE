"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LexicalContentViewerProps {
  content: string | null | undefined;
  className?: string;
}

/**
 * Read-only content viewer for Lexical/Markdown content
 * The editor stores content as Markdown, so we render it using react-markdown
 */
export function LexicalContentViewer({
  content,
  className = "",
}: LexicalContentViewerProps) {
  // Process the markdown content
  const processedContent = useMemo(() => {
    if (!content) return "";
    // The content is already stored as Markdown from LexicalEditor
    return content;
  }, [content]);

  if (!content) {
    return (
      <div className={`text-slate-400 italic ${className}`}>
        No content available
      </div>
    );
  }

  return (
    <div
      className={`prose prose-slate max-w-none ${className}`}
      // eslint-disable-next-line react/no-unknown-property
      suppressHydrationWarning
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom components for better styling
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-slate-900 mt-8 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-slate-900 mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-slate-900 mt-5 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-slate-900 mt-4 mb-2">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-base text-slate-700 leading-relaxed mb-4">
              {children}
            </p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-slate-700">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !className;

            if (isInline) {
              return (
                <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }

            return (
              <code
                className="block bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4">
              {children}
            </pre>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ""}
              className="max-w-full h-auto rounded-lg my-4"
            />
          ),
          hr: () => <hr className="border-slate-200 my-8" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-slate-200">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-slate-200 px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-200 px-4 py-2">{children}</td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
