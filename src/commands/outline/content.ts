/**
 * outline 命令在 content 中的实现：页面标题大纲
 */

let outlineHeaders: HTMLElement[] = [];

export const ACTION_GEN_OUTLINE = "GEN_OUTLINE";
export const ACTION_SCROLL_TO_OUTLINE = "SCROLL_TO_OUTLINE";

export function generateOutline(): { name: string; index: number }[] {
  const headers = document.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6");
  const levelSymbol = ["", "", "-", " -", "  -", "   -"];
  const filtered = Array.from(headers).filter((el) => (el.textContent || "").trim());
  outlineHeaders = filtered;
  return filtered.map((el, i) => {
    const level = parseInt(el.tagName.charAt(1), 10);
    const name = (levelSymbol[level] || "") + (el.textContent || "").trim().slice(0, 50);
    return { name, index: i };
  });
}

export function handleGenOutline(src: Window): void {
  src.postMessage({ action: "OUTLINE", outline: generateOutline() }, "*");
}

export function handleScrollToOutline(index: number): void {
  const el = outlineHeaders[index];
  if (el) el.scrollIntoView({ behavior: "smooth" });
}
