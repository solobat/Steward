import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";

type BlockItem = { id: string; type?: string; title: string };

export const bk: Command = {
  id: "bk",
  key: "bk",
  title: "URL Block",
  desc: "Block URL (persist)",
  loadDependsOnFilter: true,
  load(ctx: LoadContext, filter?: string) {
    const q = (filter ?? "").trim();
    if (q) {
      const addItem: ResultItem = {
        id: "bk-add",
        title: `Block: ${q.slice(0, 50)}`,
        desc: "Add to block list",
        runAction: "urlBlockAdd",
        runPayload: { type: "bk", url: q },
      };
      ctx.setSubList([addItem]);
      ctx.setItems([addItem]);
      ctx.setSelectedIndex(0);
      return;
    }
    ctx.setLoading(true);
    request<BlockItem[]>({ action: "getUrlBlockList", data: { type: "bk" } })
      .then((list) => {
        ctx.setLoading(false);
        const items: ResultItem[] = (list ?? []).map((x) => ({
          id: `bk-${x.id}`,
          title: (x.title ?? "").slice(0, 50),
          desc: "Unblock",
          runAction: "urlBlockRemove",
          runPayload: x.id,
        }));
        ctx.setSubList(items);
        ctx.setItems(items.length ? items : [{ id: "none", title: "No blocked URLs", desc: "" }]);
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([{ id: "none", title: "No blocked URLs", desc: "" }]);
      });
  },
};
