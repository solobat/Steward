/**
 * 通过 long-lived Port 与 background 通信，保证请求一定能拿到响应。
 * 用于 options 独立标签页、页面内 iframe 等 sendMessage 响应易丢失的场景。
 */

const PORT_NAME = "steward";

let port: chrome.runtime.Port | null = null;
let reqId = 0;
const pending = new Map<number, (value: unknown) => void>();

function getPort(): chrome.runtime.Port {
  if (!port) {
    port = chrome.runtime.connect({ name: PORT_NAME });
    port.onMessage.addListener((m: { id?: number; result?: unknown }) => {
      if (m?.id !== undefined && pending.has(m.id)) {
        pending.get(m.id)!(m.result);
        pending.delete(m.id);
      }
    });
    port.onDisconnect.addListener(() => {
      port = null;
      pending.forEach((resolve) => resolve(undefined));
      pending.clear();
    });
  }
  return port;
}

/**
 * 向 background 发请求并等待响应（走 Port，不依赖 sendMessage 回包）
 */
export function request<T = unknown>(msg: { action: string; data?: unknown }): Promise<T> {
  const id = ++reqId;
  return new Promise<T>((resolve) => {
    pending.set(id, resolve as (value: unknown) => void);
    try {
      getPort().postMessage({ ...msg, id });
    } catch {
      pending.delete(id);
      resolve(undefined as T);
    }
  });
}
