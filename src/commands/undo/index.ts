import type { Command, ResultItem } from "../types";
import { request } from "@/lib/portBridge";
import { fuzzyRank } from "@/lib/fuzzy";
import { siteIcon } from "@/lib/favicon";

type ClosedSession = {
  sessionId: string;
  title: string;
  url?: string;
  type: "tab" | "window";
  timeAgo: string;
};

/** 恢复最近关闭的标签页 / 窗口（chrome.sessions） */
export const undo: Command = {
  id: "undo",
  key: "undo",
  title: "Recently Closed",
  desc: "Restore closed tabs or windows",
  getResultFromFilter(filter: string): ResultItem[] | Promise<ResultItem[]> {
    return request<ClosedSession[]>({ action: "getClosedSessions" }).then((list) => {
      const arr = Array.isArray(list) ? list : [];
      const f = filter.trim().toLowerCase();
      const filtered = f ? fuzzyRank(arr, f, (s) => `${s.title} ${s.url ?? ""}`) : arr;
      if (!filtered.length) {
        return [
          {
            id: "undo-none",
            title: "Nothing closed recently",
            desc: "Closed tabs and windows will show up here",
            disabled: true,
            disabledReason: "No recently closed sessions",
          },
        ];
      }
      return filtered.map((s) => ({
        id: `closed-${s.sessionId}`,
        title: (s.title || "Untitled").slice(0, 60),
        desc: `${s.type === "window" ? "Window" : "Tab"} · ${s.timeAgo}${s.url ? ` · ${s.url}` : ""}`,
        icon: s.url ? siteIcon(s.url) : undefined,
        runAction: "restoreSession",
        runPayload: s.sessionId,
      }));
    });
  },
};
