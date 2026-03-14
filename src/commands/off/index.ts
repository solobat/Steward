import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";

type ExtItem = {
  id: string;
  name: string;
  description?: string;
  icons?: { url: string }[];
};

export const off: Command = {
  id: "off",
  key: "off",
  title: "Disable Extension",
  desc: "Disable extension",
  load(ctx: LoadContext, filter?: string) {
    ctx.setLoading(true);
    request<ExtItem[]>({ action: "getExtensions", data: { enabled: true, query: filter ?? "" } })
      .then((list) => {
        ctx.setLoading(false);
        const items: ResultItem[] = (list ?? []).map((e) => ({
          id: `ext-${e.id}`,
          title: (e.name ?? "").slice(0, 50),
          desc: (e.description ?? "").slice(0, 80),
          icon: e.icons?.[e.icons.length - 1]?.url,
          runAction: "extDisable",
          runPayload: e.id,
        }));
        ctx.setSubList(items);
        ctx.setItems(items.length ? items : [{ id: "none", title: "No enabled extensions", desc: "" }]);
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([{ id: "none", title: "No enabled extensions", desc: "" }]);
      });
  },
};
