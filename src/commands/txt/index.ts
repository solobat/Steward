import type { Command, ResultItem } from "../types";
import { request } from "@/lib/portBridge";
import { fuzzyRank } from "@/lib/fuzzy";

interface TextTool {
  id: string;
  title: string;
  apply: (text: string) => string;
}

const TOOLS: TextTool[] = [
  {
    id: "upper",
    title: "UPPERCASE",
    apply: (t) => t.toUpperCase(),
  },
  {
    id: "lower",
    title: "lowercase",
    apply: (t) => t.toLowerCase(),
  },
  {
    id: "title",
    title: "Title Case",
    apply: (t) => t.replace(/\b[a-z]/g, (c) => c.toUpperCase()),
  },
  {
    id: "reverse",
    title: "Reverse Text",
    apply: (t) => [...t].reverse().join(""),
  },
  {
    id: "trim",
    title: "Trim",
    apply: (t) => t.trim(),
  },
  {
    id: "collapse",
    title: "Collapse Whitespace",
    apply: (t) => t.replace(/\s+/g, " ").trim(),
  },
  {
    id: "url-encode",
    title: "URL Encode",
    apply: (t) => encodeURIComponent(t),
  },
  {
    id: "url-decode",
    title: "URL Decode",
    apply: (t) => {
      try {
        return decodeURIComponent(t);
      } catch {
        return t;
      }
    },
  },
  {
    id: "html-escape",
    title: "HTML Escape",
    apply: (t) =>
      t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"),
  },
  {
    id: "html-unescape",
    title: "HTML Unescape",
    apply: (t) =>
      t
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&"),
  },
  {
    id: "base64-encode",
    title: "Base64 Encode",
    apply: (t) => {
      try {
        return btoa(unescape(encodeURIComponent(t)));
      } catch {
        return t;
      }
    },
  },
  {
    id: "base64-decode",
    title: "Base64 Decode",
    apply: (t) => {
      try {
        return decodeURIComponent(escape(atob(t.trim())));
      } catch {
        return t;
      }
    },
  },
  {
    id: "json-format",
    title: "Format JSON",
    apply: (t) => {
      try {
        return JSON.stringify(JSON.parse(t), null, 2);
      } catch {
        return t;
      }
    },
  },
  {
    id: "json-minify",
    title: "Minify JSON",
    apply: (t) => {
      try {
        return JSON.stringify(JSON.parse(t));
      } catch {
        return t;
      }
    },
  },
  {
    id: "sort-lines",
    title: "Sort Lines",
    apply: (t) => t.split("\n").filter((l) => l.length).sort().join("\n"),
  },
  {
    id: "unique-lines",
    title: "Unique Lines",
    apply: (t) => [...new Set(t.split("\n").filter((l) => l.length))].join("\n"),
  },
  {
    id: "stats",
    title: "Text Stats",
    apply: (t) => {
      const chars = t.length;
      const words = (t.match(/[\w\u4e00-\u9fa5]+/g) ?? []).length;
      const lines = t.split("\n").length;
      return `${lines} lines · ${words} words · ${chars} chars`;
    },
  },
];

function preview(text: string, max = 80): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? oneLine.slice(0, max) + "…" : oneLine || "(empty)";
}

/** 文本工具集：对最近复制的文本执行转换，Enter 复制结果 */
export const txt: Command = {
  id: "txt",
  key: "txt",
  title: "Text Tools",
  desc: "Transform last copied text",
  getResultFromFilter(filter: string): ResultItem[] | Promise<ResultItem[]> {
    return request<string>({ action: "getLastCopiedText" }).then((last) => {
      const text = typeof last === "string" ? last : "";
      if (!text.trim()) {
        return [
          {
            id: "txt-none",
            title: "No copied text",
            desc: "Copy some text first, then run txt",
            disabled: true,
            disabledReason: "Clipboard is empty",
          },
        ];
      }
      const f = filter.trim().toLowerCase();
      const tools = f ? fuzzyRank(TOOLS, f, (tool) => tool.title) : TOOLS;
      return tools.map((tool) => {
        const out = tool.apply(text);
        return {
          id: `txt-${tool.id}`,
          title: tool.title,
          desc: `→ ${preview(out)}`,
          copyValue: out,
        };
      });
    });
  },
};
