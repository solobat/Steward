import type { Command, ResultItem } from "../types";
import { request } from "@/lib/portBridge";
import { fuzzyRank } from "@/lib/fuzzy";

type ActiveTabInfo = { title: string; url: string };

/** 当前标签页快捷操作：复制 URL / 标题 / Markdown 链接、无痕打开 */
export const cur: Command = {
  id: "cur",
  key: "cur",
  title: "Current Tab",
  desc: "Copy URL / title / open in incognito",
  getResultFromFilter(filter: string): ResultItem[] | Promise<ResultItem[]> {
    return request<ActiveTabInfo | null>({ action: "getActiveTab" }).then((tab) => {
      if (!tab || !tab.url) {
        return [
          {
            id: "cur-none",
            title: "No active tab",
            desc: "Open the command box from a page",
            disabled: true,
            disabledReason: "Cannot read current tab",
          },
        ];
      }
      const title = tab.title || tab.url;
      const url = tab.url;
      const items: ResultItem[] = [
        { id: "cur-copy-url", title: "Copy URL", desc: url, copyValue: url },
        { id: "cur-copy-title", title: "Copy Title", desc: title, copyValue: title },
        { id: "cur-copy-md", title: "Copy as Markdown Link", desc: `[${title}](${url})`, copyValue: `[${title}](${url})` },
        { id: "cur-copy-both", title: "Copy Title + URL", desc: `${title} - ${url}`, copyValue: `${title} - ${url}` },
        { id: "cur-incognito", title: "Open in Incognito Window", desc: url, runAction: "openIncognito", runPayload: url },
      ];
      const f = filter.trim().toLowerCase();
      const filtered = f ? fuzzyRank(items, f, (i) => `${i.title} ${i.desc ?? ""}`) : items;
      return filtered;
    });
  },
};
