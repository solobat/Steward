/**
 * nav 命令在 content 中的实现：页面内链接
 */

const MAX_NAVS = 80;
let navItems: { name: string; path: string; elem: HTMLAnchorElement }[] = [];

export const ACTION_QUERY_NAVS = "QUERY_NAVS";
export const ACTION_CLICK_NAV = "CLICK_NAV";

export function queryNavs(): { name: string; path: string }[] {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
  navItems = [];
  for (const a of links) {
    const href = a.getAttribute("href") || "";
    if (href.startsWith("javascript:") || href.startsWith("#")) continue;
    const name = (a.textContent || a.innerText || "").trim().slice(0, 60);
    if (!name) continue;
    navItems.push({ name, path: href, elem: a });
    if (navItems.length >= MAX_NAVS) break;
  }
  return navItems.map(({ name, path }) => ({ name, path }));
}

export function handleQueryNavs(src: Window): void {
  src.postMessage({ action: "NAVS", navs: queryNavs() }, "*");
}

export function handleClickNav(index: number): void {
  if (navItems[index]?.elem) navItems[index].elem.click();
}
