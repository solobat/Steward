import type { Command, LoadContext, ResultItem } from "../types";
import { request } from "@/lib/portBridge";
import { createStateItem } from "@/lib/resultState";
import { siteIcon } from "@/lib/favicon";

type DownloadItem = {
  id: number;
  url: string;
  filename: string;
  fileSize: number;
  bytesReceived: number;
  state: string;
  paused: boolean;
  endTime: string;
};

const rFilename = /(?!\/)[^/]+\.?(\w+)?$/;

function formatTitle(d: DownloadItem): string {
  const name = d.filename.match(rFilename)?.[0] ?? d.filename;
  if (d.state === "in_progress") {
    const pct = d.fileSize ? ((d.bytesReceived / d.fileSize) * 100).toFixed(1) : "0";
    const status = d.paused ? "paused" : "downloading";
    return `${name} [${pct}%] [${status}]`;
  }
  if (d.state === "interrupted") return `${name} [interrupted]`;
  return name;
}

function formatDesc(d: DownloadItem): string {
  const sizeMb = (d.fileSize / 1024 / 1024).toFixed(2);
  const time = d.endTime ? new Date(d.endTime).toLocaleString() : "";
  return `${sizeMb} MB / ${time} / ${d.url}`;
}

export const download: Command = {
  id: "download",
  key: "dl",
  title: "Downloads",
  desc: "Open download in folder",
  load(ctx: LoadContext, filter?: string) {
    ctx.setLoading(true);
    request<DownloadItem[]>({ action: "getDownloads", data: { query: filter ? [filter] : [] } })
      .then((list) => {
        ctx.setLoading(false);
        const items: ResultItem[] = (list ?? [])
          .filter((d) => d.filename)
          .map((d) => {
            const inProgress = d.state === "in_progress";
            return {
              id: `dl-${d.id}`,
              title: formatTitle(d),
              desc: formatDesc(d),
              icon: siteIcon(d.url),
              url: inProgress ? undefined : undefined,
              runAction: inProgress ? (d.paused ? "downloadResume" : "downloadPause") : "downloadShow",
              runPayload: d.id,
            } as ResultItem;
          });
        ctx.setSubList(items);
        ctx.setItems(
          items.length ? items : [createStateItem("empty", { title: "No downloads" })]
        );
        ctx.setSelectedIndex(0);
      })
      .catch(() => {
        ctx.setLoading(false);
        ctx.setItems([createStateItem("error", { title: "Failed to load downloads" })]);
      });
  },
};
