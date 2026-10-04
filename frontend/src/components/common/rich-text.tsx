"use client";

import { Fragment, useMemo } from "react";

import { CodeBlock } from "./code-block";
import { cn } from "@/lib/utils";

interface Segment {
  type: "text" | "code";
  content: string;
  language?: string;
}

const FENCE_RE = /```(\w*)\n?([\s\S]*?)```/g;
const INLINE_CODE_RE = /`([^`\n]+)`/g;

/** Split text into prose + fenced ```lang code``` segments. */
function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = FENCE_RE.exec(text)) !== null) {
    const [full, lang, code] = match;
    const before = text.slice(lastIndex, match.index);
    if (before.trim()) {
      segments.push({ type: "text", content: before });
    }
    if (code.trim()) {
      segments.push({
        type: "code",
        content: code.replace(/\n$/, ""),
        language: lang || undefined,
      });
    }
    lastIndex = match.index + full.length;
  }

  const rest = text.slice(lastIndex);
  if (rest.trim()) {
    segments.push({ type: "text", content: rest });
  }
  return segments;
}

/** Heuristic: multiline text with code-like tokens = pasted code. */
function looksLikeCode(text: string): boolean {
  if (!text.includes("\n")) return false;
  return (
    /(#include|public\s+(static|class|void)|def\s+\w+\(|function\s+\w*\(|=>|SELECT\s+.+FROM|;\s*$)/m.test(
      text,
    ) ||
    /^\s*(import|from|for|while|return|int|let|const|var)\s/m.test(
      text,
    )
  );
}

/** Best-guess language for un-fenced pasted code. */
function guessLanguage(text: string): string {
  if (/#include|std::|printf\s*\(/.test(text)) return "cpp";
  if (/System\.out|public\s+class|public\s+static\s+void/.test(text))
    return "java";
  if (/def\s+\w+\(|print\s*\(|import\s+\w+\s*$/m.test(text))
    return "python";
  if (/SELECT\s+.+FROM|INSERT\s+INTO/i.test(text)) return "sql";
  if (/<[a-z]+[^>]*>[\s\S]*<\/[a-z]+>/i.test(text)) return "markup";
  if (/=>|console\.log|const\s|let\s|function\s/.test(text))
    return "javascript";
  return "c";
}

/** `code` inline spans inside a prose segment. */
function InlineText({ text }: { text: string }) {
  const parts = text.split(INLINE_CODE_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded border border-[#3c3c3c] bg-[#1e1e1e] px-1.5 py-0.5 font-mono text-[0.85em] text-[#ce9178]"
          >
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * Renders stored question/option text with code awareness:
 * ```lang fenced blocks → syntax-highlighted editor panels,
 * `inline` → code chips, unfenced multiline code → auto-block.
 */
export function RichText({
  text,
  compact = false,
  className,
}: {
  text: string;
  /** tighter code padding — inside option chips/buttons */
  compact?: boolean;
  className?: string;
}) {
  const segments = useMemo(() => {
    const parsed = parseSegments(text);
    if (parsed.length === 0) {
      return [{ type: "text" as const, content: text }];
    }
    // Promote unfenced pasted code to a block.
    return parsed.map((seg) =>
      seg.type === "text" && looksLikeCode(seg.content)
        ? {
            type: "code" as const,
            content: seg.content,
            language: guessLanguage(seg.content),
          }
        : seg,
    );
  }, [text]);

  return (
    <div className={cn("space-y-2", className)}>
      {segments.map((seg, i) =>
        seg.type === "code" ? (
          <CodeBlock
            key={i}
            code={seg.content}
            language={seg.language}
            compact={compact}
          />
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            <InlineText text={seg.content} />
          </p>
        ),
      )}
    </div>
  );
}
