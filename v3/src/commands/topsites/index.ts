import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";

type SiteItem = { url: string; title: string };

export const topsites: Command = {
  id: "topsites",
  key: "top",
  title: "Top Sites",
  desc: "Most visited sites",
  load(ctx: LoadContext, filter?: string) {
    ctx.setLoading(true);
    request<SiteItem[]>({ action: "getTopSites" })
      .then((list) => {
        ctx.setLoading(false);
        const q = (filter ?? "").trim().toLowerCase();
        const filtered = q
          ? (list ?? []).filter(
              (s) =>
                (s.title ?? "").toLowerCase().includes(q) ||
                (s.url ?? "").toLowerCase().includes(q)
            )
          : list ?? [];
        const items: ResultItem[] = filtered.map((s) => ({
          id: `site-${s.url}`,
          title: (s.title || s.url || "").slice(0, 50),
          desc: s.url || "",
          url: s.url,
        }));
        ctx.setSubList(items);
        ctx.setItems(
          items.length ? items : [{ id: "none", title: "No top sites", desc: "" }]
        );
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([{ id: "none", title: "No top sites", desc: "" }]);
      });
  },
};
