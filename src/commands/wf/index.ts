import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";
import { createStateItem } from "@/lib/resultState";
import { fuzzyRank } from "@/lib/fuzzy";

function finishLoading(ctx: LoadContext, items: ResultItem[]) {
  ctx.setLoading(false);
  ctx.setSubList(items);
  ctx.setItems(items.length ? items : [createStateItem("empty", { title: "No match" })]);
  ctx.setSelectedIndex(0);
}

type WorkflowRaw = { id: string; title: string; desc?: string; content: string };

/** 工作流：通过 Port 向 background 拉列表，不依赖 storage，查询即请求 */
export const wf: Command = {
  id: "wf",
  key: "wf",
  title: "Workflows",
  desc: "Run or edit workflows",
  loadWorkflows(ctx: LoadContext, filter: string) {
    ctx.setLoading(true);
    ctx.setItems([]);

    request<WorkflowRaw[]>({ action: "getWorkflows" })
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        const f = filter.trim().toLowerCase();
        const filtered = f
          ? fuzzyRank(arr, f, (w) => `${w.title ?? ""} ${w.desc ?? ""}`)
          : arr;
        const items: ResultItem[] = filtered.map((w) => ({
          id: `wf-${w.id}`,
          title: w.title ?? "",
          desc: w.desc ?? "",
          workflowId: w.id,
          workflowContent: w.content ?? "",
        }));
        finishLoading(ctx, items);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setSubList([]);
        ctx.setItems([createStateItem("error", { title: "No workflows or request failed" })]);
        ctx.setSelectedIndex(0);
      });
  },
};
