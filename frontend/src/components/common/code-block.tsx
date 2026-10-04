"use client";

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import c from "react-syntax-highlighter/dist/esm/languages/prism/c";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import csharp from "react-syntax-highlighter/dist/esm/languages/prism/csharp";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("c", c);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("csharp", csharp);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("jsx", javascript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("markup", markup);
SyntaxHighlighter.registerLanguage("html", markup);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("tsx", typescript);

/**
 * Editor-style code block (VS Code Dark+ palette) used
 * everywhere question text or options are rendered.
 */
export function CodeBlock({
  code,
  language,
  compact = false,
}: {
  code: string;
  language?: string;
  /** tighter padding — for options inside cards/buttons */
  compact?: boolean;
}) {
  const multiLine = code.includes("\n");

  return (
    <div className="group/code relative overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#1e1e1e] text-left">
      {language && (
        <span className="absolute right-2 top-1.5 z-10 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/60">
          {language}
        </span>
      )}
      <SyntaxHighlighter
        language={language || "text"}
        style={vscDarkPlus}
        showLineNumbers={multiLine && code.split("\n").length > 2}
        lineNumberStyle={{
          minWidth: "2.25em",
          paddingRight: "0.75em",
          color: "#6e7681",
          userSelect: "none",
        }}
        customStyle={{
          margin: 0,
          padding: compact ? "0.625rem 0.75rem" : "0.875rem 1rem",
          background: "transparent",
          fontSize: compact ? "0.8125rem" : "0.875rem",
          lineHeight: 1.6,
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'ui-monospace, "Cascadia Code", "JetBrains Mono", Consolas, monospace',
          },
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
