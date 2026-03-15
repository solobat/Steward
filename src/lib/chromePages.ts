/**
 * Chrome 内置页 URL，用于命令框主模式下列表（优先级在命令之下）
 * 选中后通过 item.url 打开
 *
 * 路径已对照 Chrome/Chromium 当前设置路由与公开列表（如 oTechWorld）核对，均为有效。
 * 完整内置页列表可在浏览器中打开 chrome://chrome-urls 查看。
 * 注：chrome://tab-search、chrome://apps 等在新版 Chrome 中可用，旧版可能无对应页。
 */
export interface ChromePageItem {
  id: string;
  url: string;
  titleKey: string;
}

export const CHROME_PAGES: ChromePageItem[] = [
  // 常用
  { id: "chrome-downloads", url: "chrome://downloads", titleKey: "chrome_page_downloads" },
  { id: "chrome-bookmarks", url: "chrome://bookmarks", titleKey: "chrome_page_bookmarks" },
  { id: "chrome-extensions", url: "chrome://extensions", titleKey: "chrome_page_extensions" },
  { id: "chrome-history", url: "chrome://history", titleKey: "chrome_page_history" },
  { id: "chrome-newtab", url: "chrome://newtab", titleKey: "chrome_page_newtab" },
  // 设置首页与子页（路径与 Chromium settings 路由一致）
  { id: "chrome-settings", url: "chrome://settings", titleKey: "chrome_page_settings" },
  { id: "chrome-settings-privacy", url: "chrome://settings/privacy", titleKey: "chrome_page_settings_privacy" },
  { id: "chrome-settings-passwords", url: "chrome://password-manager/settings", titleKey: "chrome_page_settings_passwords" },
  { id: "chrome-settings-content", url: "chrome://settings/content", titleKey: "chrome_page_settings_content" },
  { id: "chrome-settings-clearData", url: "chrome://settings/clearBrowserData", titleKey: "chrome_page_clear_data" },
  { id: "chrome-settings-cookies", url: "chrome://settings/cookies", titleKey: "chrome_page_settings_cookies" },
  { id: "chrome-settings-notifications", url: "chrome://settings/content/notifications", titleKey: "chrome_page_settings_notifications" },
  { id: "chrome-settings-languages", url: "chrome://settings/languages", titleKey: "chrome_page_settings_languages" },
  { id: "chrome-settings-appearance", url: "chrome://settings/appearance", titleKey: "chrome_page_settings_appearance" },
  { id: "chrome-settings-accessibility", url: "chrome://settings/accessibility", titleKey: "chrome_page_settings_accessibility" },
  { id: "chrome-settings-search", url: "chrome://settings/searchEngines", titleKey: "chrome_page_settings_search" },
  { id: "chrome-settings-autofill", url: "chrome://settings/autofill", titleKey: "chrome_page_settings_autofill" },
  { id: "chrome-settings-security", url: "chrome://settings/security", titleKey: "chrome_page_settings_security" },
  { id: "chrome-settings-sync", url: "chrome://settings/syncSetup", titleKey: "chrome_page_settings_sync" },
  { id: "chrome-settings-addresses", url: "chrome://settings/addresses", titleKey: "chrome_page_settings_addresses" },
  { id: "chrome-settings-payments", url: "chrome://settings/payments", titleKey: "chrome_page_settings_payments" },
  { id: "chrome-settings-performance", url: "chrome://settings/performance", titleKey: "chrome_page_settings_performance" },
  { id: "chrome-settings-onStartup", url: "chrome://settings/onStartup", titleKey: "chrome_page_settings_on_startup" },
  { id: "chrome-settings-downloads", url: "chrome://settings/downloads", titleKey: "chrome_page_settings_downloads" },
  { id: "chrome-settings-help", url: "chrome://settings/help", titleKey: "chrome_page_settings_help" },
  // 其它
  { id: "chrome-flags", url: "chrome://flags", titleKey: "chrome_page_flags" },
  { id: "chrome-version", url: "chrome://version", titleKey: "chrome_page_version" },
  { id: "chrome-components", url: "chrome://components", titleKey: "chrome_page_components" },
  { id: "chrome-apps", url: "chrome://apps", titleKey: "chrome_page_apps" },
  { id: "chrome-system", url: "chrome://system", titleKey: "chrome_page_system" },
  { id: "chrome-tab-search", url: "chrome://tab-search", titleKey: "chrome_page_tab_search" },
];

/** 按查询串过滤：匹配 title、完整 url 或 url 路径（如输入 chrome 可匹配所有 chrome:// 页） */
export function filterChromePages(
  items: ChromePageItem[],
  query: string,
  getTitle: (key: string) => string
): { id: string; title: string; desc: string; url: string }[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.map((p) => ({ id: p.id, title: getTitle(p.titleKey), desc: p.url, url: p.url }));
  const pathPart = (url: string) => url.replace(/^chrome:\/\//, "").toLowerCase();
  return items
    .filter((p) => {
      const title = getTitle(p.titleKey).toLowerCase();
      const path = pathPart(p.url);
      const urlLower = p.url.toLowerCase();
      return title.includes(q) || path.includes(q) || urlLower.includes(q);
    })
    .map((p) => ({ id: p.id, title: getTitle(p.titleKey), desc: p.url, url: p.url }));
}
