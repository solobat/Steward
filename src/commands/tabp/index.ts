import type { Command, LoadContext, ResultItem } from "../types";
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

function buildTabItems(tabs: TabItem[]): ResultItem[] {
  const sorted = [...tabs].sort((a, b) => (a.active ? -1 : b.active ? 1 : 0));
  return sorted.map((t) => ({
    id: `tab-${t.id}`,
    title: t.active ? `Active: ${(t.title || t.url || "").slice(0, 50)}` : (t.title || t.url || "").slice(0, 50),
    desc: t.url || "",
    icon: t.favIconUrl,
    runAction: "tabPin" as const,
    runPayload: { tabId: t.id, pinned: !t.pinned },
  }));
}

export const tabp: Command = {
  id: "tabp",
  key: "tabp",
  title: "Pin Tab",
  desc: "Toggle pin tab",
  load(ctx: LoadContext, filter?: string) {
    ctx.setLoading(true);
    request<TabItem[]>({ action: "getTabs", data: { query: filter ?? "" } })
      .then((tabs) => {
        ctx.setLoading(false);
        const items = buildTabItems(tabs);
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
