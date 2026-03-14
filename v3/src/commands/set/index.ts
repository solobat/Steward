import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";

type ExtItem = {
  id: string;
  name: string;
  description?: string;
  optionsUrl?: string;
  icons?: { url: string }[];
};

export const set: Command = {
  id: "set",
  key: "set",
  title: "Extension Options",
  desc: "Open extension options page",
  load(ctx: LoadContext, filter?: string) {
    ctx.setLoading(true);
    request<ExtItem[]>({ action: "getExtensions", data: { enabled: true, query: filter ?? "" } })
      .then((list) => {
        ctx.setLoading(false);
        const items: ResultItem[] = (list ?? [])
          .filter((e) => e.optionsUrl)
          .map((e) => ({
            id: `ext-${e.id}`,
            title: (e.name ?? "").slice(0, 50),
            desc: (e.description ?? "").slice(0, 80),
            icon: e.icons?.[e.icons.length - 1]?.url,
            url: e.optionsUrl,
          }));
        ctx.setSubList(items);
        ctx.setItems(items.length ? items : [{ id: "none", title: "No extensions with options", desc: "" }]);
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([{ id: "none", title: "No extensions with options", desc: "" }]);
      });
  },
};
