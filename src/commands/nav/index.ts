import type { Command, LoadContext } from "../types";

/** 页面链接：当前页内的 a[href] 列表；结果由 content 通过 postMessage NAVS 回传；仅页面内可用 */
export const nav: Command = {
  id: "nav",
  key: "nav",
  title: "Page Links",
  desc: "Links on current page",
  pageOnly: true,
  capabilityRequirements: ["pageContext"],
  mode: "pageNavs",
  load(ctx: LoadContext) {
    ctx.setLoading(true);
    window.parent.postMessage({ action: "QUERY_NAVS" }, "*");
  },
};
