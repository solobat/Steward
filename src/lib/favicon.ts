/**
 * 站点图标：优先使用扩展内建 favicon 服务（需 manifest "favicon" 权限），
 * 对 chrome:// 等无法服务的地址返回空串。
 */
export function faviconUrl(url: string, size = 32): string {
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) return "";
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
  } catch {
    return "";
  }
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(
      `/_favicon/?pageUrl=${encodeURIComponent(url)}&size=${size}`
    );
  }
  return "";
}

/** 生成站点图标 URL（供命令结果填充 icon 字段） */
export function siteIcon(url: string | undefined, size = 32): string | undefined {
  if (!url) return undefined;
  const icon = faviconUrl(url, size);
  return icon || undefined;
}
