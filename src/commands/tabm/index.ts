import type { Command, LoadContext } from "../types";
import { request } from "@/lib/portBridge";

type TabItem = {
  id: number;
  title: string;
  url: string;
  active: boolean;
  pinned: boolean;
  muted: boolean;
  favIconUrl?: string;
};

export const tabm: Command = {
  id: "tabm",
  key: "tabm",
  title: "Move Tab",
  desc: "Move tab to index (type number)",
  loadDependsOnFilter: true,
  load(ctx: LoadContext, filter?: string) {
    ctx.setLoading(true);
    const index = parseInt(filter ?? "", 10);
    const targetIndex = Number.isFinite(index) && index >= -1 ? index : -1;
    request<TabItem[]>({ action: "getTabs", data: { query: "" } })
      .then((tabs) => {
        ctx.setLoading(false);
        const sorted = [...tabs].sort((a, b) => (a.active ? -1 : b.active ? 1 : 0));
        const items = sorted.map((t) => ({
          id: `tab-${t.id}`,
          title: t.active ? `Active: ${(t.title || t.url || "").slice(0, 50)}` : (t.title || t.url || "").slice(0, 50),
          desc: t.url || "",
          icon: t.favIconUrl,
          runAction: "tabMove" as const,
          runPayload: { tabId: t.id, index: targetIndex },
        }));
        ctx.setSubList(items);
        ctx.setItems(items);
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([{ id: "none", title: "No tabs", desc: "" }]);
      });
  },
};
