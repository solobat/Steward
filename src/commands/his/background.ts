/**
 * his 命令在 background 中的实现：拉取浏览历史，直接返回（不写 storage）
 */
export function handleGetHistory(): Promise<{ id: string; title: string; url: string }[]> {
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return chrome.history
    .search({ text: "", startTime: since, maxResults: 50 })
    .then((items) =>
      (items || []).map((h) => ({
        id: String(h.id),
        title: h.title || h.url || "",
        url: h.url || "",
      }))
    )
    .catch(() => [] as { id: string; title: string; url: string }[]);
}
