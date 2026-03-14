import type { Command, LoadContext } from "../types";

/** 当前页信息：标题、URL、选区等；结果由 content 通过 postMessage META 回传 */
export const meta: Command = {
  id: "meta",
  key: "meta",
  title: "Page Info",
  desc: "Title, URL, selection",
  mode: "pageMeta",
  load(ctx: LoadContext) {
    ctx.setLoading(true);
    window.parent.postMessage({ action: "GET_META" }, "*");
  },
};
