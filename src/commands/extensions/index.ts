import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";
import { createStateItem } from "@/lib/resultState";

type ExtItem = {
  id: string;
  name: string;
  description?: string;
  homepageUrl?: string;
  icons?: { url: string }[];
};

export const extensions: Command = {
  id: "extensions",
  key: "ext",
  title: "View Extension",
  desc: "Open extension in chrome://extensions",
  load(ctx: LoadContext, filter?: string) {
    ctx.setLoading(true);
    request<ExtItem[]>({ action: "getExtensions", data: { query: filter ?? "" } })
      .then((list) => {
        ctx.setLoading(false);
        const items: ResultItem[] = (list ?? []).map((e) => ({
          id: `ext-${e.id}`,
          title: (e.name ?? "").slice(0, 50),
          desc: (e.description ?? "").slice(0, 80),
          icon: e.icons?.[0]?.url,
          url: `chrome://extensions/?id=${e.id}`,
        }));
        ctx.setSubList(items);
        ctx.setItems(items.length ? items : [createStateItem("empty", { title: "No extensions" })]);
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([createStateItem("error", { title: "Failed to load extensions" })]);
      });
  },
};
