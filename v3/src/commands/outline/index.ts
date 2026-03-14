import type { Command, LoadContext } from "../types";

/** 页面大纲：h1–h6 标题；结果由 content 通过 postMessage OUTLINE 回传 */
export const outline: Command = {
  id: "outline",
  key: "outline",
  title: "Outline",
  desc: "h1–h6 headings",
  mode: "pageOutline",
  load(ctx: LoadContext) {
    ctx.setLoading(true);
    window.parent.postMessage({ action: "GEN_OUTLINE" }, "*");
  },
};
