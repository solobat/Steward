import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";
import { createStateItem } from "@/lib/resultState";
import { fuzzyRank } from "@/lib/fuzzy";
import { siteIcon } from "@/lib/favicon";

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
          ? fuzzyRank(list ?? [], q, (s) => `${s.title ?? ""} ${s.url ?? ""}`)
          : list ?? [];
        const items: ResultItem[] = filtered.map((s) => ({
          id: `site-${s.url}`,
          title: (s.title || s.url || "").slice(0, 50),
          desc: s.url || "",
          url: s.url,
          icon: siteIcon(s.url),
        }));
        ctx.setSubList(items);
        ctx.setItems(
          items.length ? items : [createStateItem("empty", { title: "No top sites" })]
        );
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([createStateItem("error", { title: "Failed to load top sites" })]);
      });
  },
};
