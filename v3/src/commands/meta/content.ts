/**
 * meta 命令在 content 中的实现：当前页元信息
 */

export const ACTION_GET_META = "GET_META";

interface MetaRow {
  title: string;
  desc: string;
  key: string;
}

function getMeta(): MetaRow[] {
  const title = document.title || "";
  const url = window.location.href;
  const host = window.location.host;
  const pathname = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;
  const selection = (window.getSelection() || "").toString();
  const rows: MetaRow[] = [
    { title: "Title", desc: title, key: "copy" },
    { title: "URL", desc: url, key: "copy" },
    { title: "Host", desc: host, key: "copy" },
    { title: "Path", desc: pathname, key: "copy" },
    { title: "Search", desc: search || "(empty)", key: "copy" },
    { title: "Hash", desc: hash || "(empty)", key: "copy" },
  ];
  if (selection) {
    rows.push({
      title: "Selection",
      desc: selection.slice(0, 80) + (selection.length > 80 ? "…" : ""),
      key: "copy",
    });
  }
  return rows;
}

export function handleGetMeta(src: Window): void {
  src.postMessage({ action: "META", meta: getMeta() }, "*");
}
