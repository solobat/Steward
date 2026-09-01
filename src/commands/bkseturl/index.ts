import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";
import { createStateItem } from "@/lib/resultState";

export const bkseturl: Command = {
  id: "bkseturl",
  key: "bks",
  title: "URL Block Replace",
  desc: "Replace page URL list",
  loadDependsOnFilter: true,
  load(ctx: LoadContext, filter?: string) {
    const q = (filter ?? "").trim();
    if (q) {
      const addItem: ResultItem = {
        id: "bkseturl-add",
        title: `Add: ${q.slice(0, 50)}`,
        desc: "Add to replace list",
        runAction: "urlBlockReplaceAdd",
        runPayload: q,
      };
      ctx.setSubList([addItem]);
      ctx.setItems([addItem]);
      ctx.setSelectedIndex(0);
      return;
    }
    ctx.setLoading(true);
    request<string[]>({ action: "getUrlBlockReplaceList" })
      .then((list) => {
        ctx.setLoading(false);
        const items: ResultItem[] = (list ?? []).map((url, i) => ({
          id: `bkseturl-${i}`,
          title: `URL ${i + 1}`,
          desc: url,
          runAction: "urlBlockReplaceRemove",
          runPayload: url,
        }));
        ctx.setSubList(items);
        ctx.setItems(items.length ? items : [createStateItem("empty", { title: "No replace URLs" })]);
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([createStateItem("error", { title: "Failed to load replace URLs" })]);
      });
  },
};
