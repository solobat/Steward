import type { Command, ResultItem } from "../types";

/** 像域名/URL 的输入即可提示打开（Alfred 风格），可无协议 */
export function isUrlLike(s: string): boolean {
  const t = s.replace(/。/g, ".").trim();
  if (!t || t.length < 4) return false;
  if (/^https?:\/\//i.test(t)) return true;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(t)) return true;
  if (/^localhost(:\d+)?(\/.*)?$/i.test(t)) return true;
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/.test(t)) return true;
  return false;
}

function toUrl(s: string): string {
  const t = s.replace(/。/g, ".").trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `http://${t}`;
}

export const openurl: Command = {
  id: "openurl",
  key: "url",
  title: "Open URL",
  desc: "Open URL in new tab",
  getResultFromFilter(filter: string): ResultItem[] {
    const trimmed = filter.trim();
    if (!trimmed) return [{ id: "openurl-none", title: "Enter URL", desc: "e.g. example.com" }];
    if (!isUrlLike(trimmed))
      return [{ id: "openurl-err", title: "Not a URL", desc: "e.g. example.com or https://..." }];
    const url = toUrl(trimmed);
    return [
      {
        id: "openurl-1",
        title: url.slice(0, 50),
        desc: "Open in new tab",
        url,
      },
    ];
  },
};
