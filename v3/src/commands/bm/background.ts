/**
 * bm 命令在 background 中的实现：拉取书签，直接返回（不写 storage）
 */
function getBookmarksList(): Promise<{ id: string; title: string; url: string }[]> {
  return chrome.bookmarks
    .getRecent(20)
    .then((nodes) =>
      nodes
        .filter((n) => n.url)
        .map((n) => ({ id: n.id, title: n.title || n.url || "", url: n.url! }))
    );
}

export function handleGetBookmarks(): Promise<{ id: string; title: string; url: string }[]> {
  return getBookmarksList().catch(() => [] as { id: string; title: string; url: string }[]);
}
