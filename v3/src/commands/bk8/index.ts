import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";

type BlockItem = { id: string; type?: string; title: string };

export const bk8: Command = {
  id: "bk8",
  key: "bk8",
  title: "URL Block 8h",
  desc: "Block URL for 8 hours",
  loadDependsOnFilter: true,
  load(ctx: LoadContext, filter?: string) {
    const q = (filter ?? "").trim();
    if (q) {
      const addItem: ResultItem = {
        id: "bk8-add",
        title: `Block 8h: ${q.slice(0, 50)}`,
        desc: "Add to block list (8h)",
        runAction: "urlBlockAdd",
        runPayload: { type: "bk8", url: q },
      };
      ctx.setSubList([addItem]);
      ctx.setItems([addItem]);
      ctx.setSelectedIndex(0);
      return;
    }
    ctx.setLoading(true);
    request<BlockItem[]>({ action: "getUrlBlockList", data: { type: "bk8" } })
      .then((list) => {
        ctx.setLoading(false);
        const items: ResultItem[] = (list ?? []).map((x) => ({
          id: `bk8-${x.id}`,
          title: (x.title ?? "").slice(0, 50),
          desc: "Unblock",
          runAction: "urlBlockRemove",
          runPayload: x.id,
        }));
        ctx.setSubList(items);
        ctx.setItems(items.length ? items : [{ id: "none", title: "No 8h blocked URLs", desc: "" }]);
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([{ id: "none", title: "No 8h blocked URLs", desc: "" }]);
      });
  },
};
