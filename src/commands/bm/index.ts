import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";

type BookmarkItem = { id: string; title?: string; url?: string };

/** 书签：最近添加的书签；通过 Port 向 background 请求，直接拿响应 */
export const bm: Command = {
  id: "bm",
  key: "bm",
  title: "Bookmarks",
  desc: "Recent bookmarks",
  mode: "bookmarks",
  load(ctx: LoadContext) {
    ctx.setLoading(true);
    ctx.setMode("bookmarks");
    request<BookmarkItem[]>({ action: "getBookmarks" })
      .then((stored) => {
        ctx.setLoading(false);
        if (Array.isArray(stored) && stored.length > 0) {
          const next: ResultItem[] = stored.map((b) => ({
            id: `bm-${b.id}`,
            title: (b.title || b.url || "").slice(0, 50),
            desc: b.url || "",
            url: b.url || "",
          }));
          ctx.setSubList(next);
          ctx.setItems(next);
          ctx.setSelectedIndex(0);
        } else {
          ctx.setItems([{ id: "none", title: "No bookmarks", desc: "" }]);
        }
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([{ id: "none", title: "No bookmarks", desc: "" }]);
      });
  },
};
