import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";

type HistoryItem = { id: string; title?: string; url?: string };

/** 历史：最近访问；通过 Port 向 background 请求，直接拿响应 */
export const his: Command = {
  id: "his",
  key: "his",
  title: "History",
  desc: "Recently visited",
  mode: "history",
  load(ctx: LoadContext) {
    ctx.setLoading(true);
    ctx.setMode("history");
    request<HistoryItem[]>({ action: "getHistory" })
      .then((stored) => {
        ctx.setLoading(false);
        if (Array.isArray(stored) && stored.length > 0) {
          const next: ResultItem[] = stored.map((h) => ({
            id: `hist-${h.id}`,
            title: (h.title || h.url || "").slice(0, 50),
            desc: h.url || "",
            url: h.url || "",
          }));
          ctx.setSubList(next);
          ctx.setItems(next);
          ctx.setSelectedIndex(0);
        } else {
          ctx.setItems([{ id: "none", title: "No history", desc: "" }]);
        }
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([{ id: "none", title: "No history", desc: "" }]);
      });
  },
};
