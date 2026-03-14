import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";

type ExtItem = {
  id: string;
  name: string;
  description?: string;
  icons?: { url: string }[];
};

export const on: Command = {
  id: "on",
  key: "on",
  title: "Enable Extension",
  desc: "Enable disabled extension",
  load(ctx: LoadContext, filter?: string) {
    ctx.setLoading(true);
    request<ExtItem[]>({ action: "getExtensions", data: { enabled: false, query: filter ?? "" } })
      .then((list) => {
        ctx.setLoading(false);
        const items: ResultItem[] = (list ?? []).map((e) => ({
          id: `ext-${e.id}`,
          title: (e.name ?? "").slice(0, 50),
          desc: (e.description ?? "").slice(0, 80),
          icon: e.icons?.[e.icons.length - 1]?.url,
          runAction: "extEnable",
          runPayload: e.id,
        }));
        ctx.setSubList(items);
        ctx.setItems(items.length ? items : [{ id: "none", title: "No disabled extensions", desc: "" }]);
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([{ id: "none", title: "No disabled extensions", desc: "" }]);
      });
  },
};
