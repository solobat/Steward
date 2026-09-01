import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";
import { createStateItem } from "@/lib/resultState";

type TabItem = {
  id: number;
  title: string;
  url: string;
  active: boolean;
  pinned: boolean;
  muted: boolean;
  favIconUrl?: string;
};

function buildTabItems(tabs: TabItem[], runAction: string, runPayload: (t: TabItem) => unknown): ResultItem[] {
  const sorted = [...tabs].sort((a, b) => (a.active ? -1 : b.active ? 1 : 0));
  return sorted.map((t) => ({
    id: `tab-${t.id}`,
    title: t.active ? `Active: ${(t.title || t.url || "").slice(0, 50)}` : (t.title || t.url || "").slice(0, 50),
    desc: t.url || "",
    icon: t.favIconUrl,
    runAction,
    runPayload: runPayload(t),
  }));
}

export const tab: Command = {
  id: "tab",
  key: "tab",
  title: "Tabs",
  desc: "Switch to tab",
  load(ctx: LoadContext, filter?: string) {
    ctx.setLoading(true);
    request<TabItem[]>({ action: "getTabs", data: { query: filter ?? "" } })
      .then((tabs) => {
        ctx.setLoading(false);
        const items = buildTabItems(tabs, "tabActivate", (t) => t.id);
        ctx.setSubList(items);
        ctx.setItems(items.length ? items : [createStateItem("empty", { title: "No tabs" })]);
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([createStateItem("error", { title: "Failed to load tabs" })]);
      });
  },
};
