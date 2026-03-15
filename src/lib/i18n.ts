/**
 * i18n: 使用 Chrome 扩展 _locales，与旧版 v2 的 helper 一致
 * substitutions 对应 messages 中的 $1, $2…
 */
export function t(key: string, substitutions?: string | string[]): string {
  if (typeof chrome !== "undefined" && chrome.i18n?.getMessage) {
    const subs = substitutions === undefined ? undefined : Array.isArray(substitutions) ? substitutions : [substitutions];
    const msg = chrome.i18n.getMessage(key, subs);
    return msg !== "" ? msg : key;
  }
  return key;
}
