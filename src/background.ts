/**
 * Steward v3 - Service Worker (MV3)
 * 不持久内存状态，按需从 storage 读取；getHistory/getBookmarks 委托给 commands 实现。
 * 工作流 wait 后由 alarm 触发，可在 background 直接执行 URL 打开、聚焦窗口、下一轮 wait，无需 popup。
 */
import type { Workflow } from "./types/workflow";
import { handleGetHistory } from "./commands/his/background";
import { handleGetBookmarks } from "./commands/bm/background";
import { isWaitStep, parseWaitMs, isFocusWindowStep, parseFocusWindowIndex } from "./lib/workflow";

const WORKFLOW_ADVANCE_KEY = "workflowAdvanceState";

function isUrlLike(s: string): boolean {
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

const WORKFLOWS_KEY = "workflows";
/** 与旧版 extension 一致：屏蔽列表用 url，替换页用 urlblock_replace_page */
const URL_BLOCK_LIST_KEY = "url";
const URL_BLOCK_REPLACE_PAGE_KEY = "urlblock_replace_page";
const BK8_EXPIRE_MS = 8 * 60 * 60 * 1000;

async function getWorkflowsFromStorage(): Promise<Workflow[]> {
  const r = await chrome.storage.sync.get(WORKFLOWS_KEY);
  const raw = r[WORKFLOWS_KEY];
  return Array.isArray(raw) ? raw : [];
}

/** 递归取某书签文件夹下所有书签（叶子节点），用于自定义命令内置数据源 */
async function getBookmarkFolderLeaves(
  folderId: string
): Promise<{ id: string; title: string; url: string }[]> {
  const out: { id: string; title: string; url: string }[] = [];
  const children = await chrome.bookmarks.getChildren(folderId);
  for (const node of children ?? []) {
    if (node.url) {
      out.push({ id: node.id, title: node.title || node.url || "", url: node.url });
    } else {
      out.push(...(await getBookmarkFolderLeaves(node.id)));
    }
  }
  return out;
}

export type RequestMessage = { action: string; data?: unknown; id?: number };

export async function handleRequest(msg: RequestMessage): Promise<unknown> {
  switch (msg.action) {
    case "getConfig":
      return chrome.storage.sync.get("config").then((r) => r.config ?? {});
    case "getData":
      return chrome.storage.sync.get(["config"]).then((r) => ({
        config: r.config ?? {},
      }));
    case "getHistory":
      return handleGetHistory();
    case "getBookmarks":
      return handleGetBookmarks();
    case "getBookmarkFolder": {
      const folderId = (msg.data as string) ?? "1";
      return getBookmarkFolderLeaves(folderId).catch(() => []);
    }
    case "saveLastQuery":
      return chrome.storage.local.set({ lastQuery: msg.data }).then(() => ({ ok: true }));
    case "getLastQuery":
      return chrome.storage.local.get("lastQuery").then((r) => r.lastQuery ?? "");
    case "saveConfig":
      return chrome.storage.sync
        .set({ config: msg.data })
        .then(() => ({ ok: true }));
    case "getWorkflows":
      return getWorkflowsFromStorage();
    case "getWorkflow": {
      const id = msg.data as string;
      const list = await getWorkflowsFromStorage();
      return list.find((w) => w.id === id) ?? null;
    }
    case "createWorkflow": {
      const w = msg.data as Partial<Workflow> & { title: string; content: string };
      const id = `wf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const now = Date.now();
      const workflow: Workflow = {
        id,
        title: (w?.title ?? "New Workflow").trim() || "New Workflow",
        desc: (w?.desc ?? "").trim(),
        content: (w?.content ?? "").trim(),
        created: now,
        updated: now,
      };
      const list = await getWorkflowsFromStorage();
      const next = [...list, workflow];
      try {
        await chrome.storage.sync.set({ [WORKFLOWS_KEY]: next });
      } catch {
        // 配额等失败时仍把内存结果返回给调用方
      }
      return { list: next, workflow };
    }
    case "updateWorkflow": {
      const w = msg.data as Partial<Workflow> & { id: string };
      const list = await getWorkflowsFromStorage();
      const idx = list.findIndex((x) => x.id === w.id);
      if (idx < 0) return null;
      const next = [...list];
      next[idx] = { ...next[idx], ...w, updated: Date.now() };
      try {
        await chrome.storage.sync.set({ [WORKFLOWS_KEY]: next });
      } catch {}
      return { list: next, workflow: next[idx] };
    }
    case "removeWorkflow": {
      const id = msg.data as string;
      const list = await getWorkflowsFromStorage();
      const next = list.filter((w) => w.id !== id);
      await chrome.storage.sync.set({ [WORKFLOWS_KEY]: next });
      return { ok: true };
    }
    case "getTabs": {
      const query = (msg.data as { query?: string })?.query ?? "";
      const wins = await chrome.windows.getAll({ populate: true });
      let win = wins.find((w) => w.focused);
      if (!win) win = await chrome.windows.getLastFocused({ populate: true }).catch(() => wins[0]);
      const tabs = (win?.tabs ?? []).filter(
        (t) =>
          !query ||
          [t.title ?? "", t.url ?? ""].some((s) => s.toLowerCase().includes(query.toLowerCase()))
      );
      return tabs.map((t) => ({
        id: t.id,
        title: t.title ?? "",
        url: t.url ?? "",
        active: t.active,
        pinned: t.pinned,
        muted: (t as chrome.tabs.Tab & { mutedInfo?: { muted?: boolean } }).mutedInfo?.muted ?? false,
        favIconUrl: t.favIconUrl,
      }));
    }
    case "tabActivate": {
      const tabId = msg.data as number;
      await chrome.tabs.update(tabId, { active: true });
      return { ok: true };
    }
    case "tabClose": {
      const ids = Array.isArray(msg.data) ? (msg.data as number[]) : [msg.data as number];
      await chrome.tabs.remove(ids.filter((id) => typeof id === "number"));
      return { ok: true };
    }
    case "tabMove": {
      const { tabId, index } = msg.data as { tabId: number; index: number };
      await chrome.tabs.move(tabId, { index });
      return { ok: true };
    }
    case "tabPin": {
      const { tabId, pinned } = msg.data as { tabId: number; pinned: boolean };
      await chrome.tabs.update(tabId, { pinned });
      return { ok: true };
    }
    case "tabMute": {
      const { tabId, muted } = msg.data as { tabId: number; muted: boolean };
      await chrome.tabs.update(tabId, { muted });
      return { ok: true };
    }
    case "getExtensions": {
      const { enabled, query: q } = (msg.data as { enabled?: boolean; query?: string }) ?? {};
      const all = await chrome.management.getAll();
      const list = all.filter(
        (e) =>
          e.type === "extension" &&
          (enabled === undefined || e.enabled === enabled) &&
          (!q || (e.name ?? "").toLowerCase().includes(q.toLowerCase()))
      );
      return list.map((e) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        enabled: e.enabled,
        optionsUrl: e.optionsUrl,
        homepageUrl: e.homepageUrl,
        icons: e.icons,
        installType: e.installType,
      }));
    }
    case "extEnable": {
      const id = msg.data as string;
      await chrome.management.setEnabled(id, true);
      return { ok: true };
    }
    case "extDisable": {
      const id = msg.data as string;
      await chrome.management.setEnabled(id, false);
      return { ok: true };
    }
    case "extUninstall": {
      const id = msg.data as string;
      await chrome.management.uninstall(id);
      return { ok: true };
    }
    case "getDownloads": {
      const query = (msg.data as { query?: string })?.query ?? [];
      const list = await chrome.downloads.search({
        query: Array.isArray(query) ? query : query ? [query] : [],
        limit: 30,
      });
      return (list ?? []).map((d) => ({
        id: d.id,
        url: d.url,
        filename: d.filename,
        fileSize: d.totalBytes ?? 0,
        bytesReceived: d.bytesReceived ?? 0,
        state: d.state,
        paused: d.paused ?? false,
        endTime: d.endTime ?? "",
      }));
    }
    case "downloadShow": {
      const id = msg.data as number;
      await chrome.downloads.show(id);
      return { ok: true };
    }
    case "downloadPause": {
      const id = msg.data as number;
      await chrome.downloads.pause(id);
      return { ok: true };
    }
    case "downloadResume": {
      const id = msg.data as number;
      await chrome.downloads.resume(id);
      return { ok: true };
    }
    case "downloadCancel": {
      const id = msg.data as number;
      await chrome.downloads.cancel(id);
      return { ok: true };
    }
    case "getTopSites": {
      const sites = await chrome.topSites.get();
      return (sites ?? []).map((s) => ({ url: s.url, title: s.title }));
    }
    case "getUrlBlockList": {
      const { type: blockType } = (msg.data as { type?: string }) ?? {};
      const r = await chrome.storage.sync.get([URL_BLOCK_LIST_KEY]);
      const raw = r[URL_BLOCK_LIST_KEY];
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const filtered =
        blockType === "bk8"
          ? list.filter((x: { type?: string }) => (x?.type ?? "bk8") === "bk8")
          : list.filter((x: { type?: string }) => (x?.type ?? "bk") === "bk");
      return filtered;
    }
    case "getUrlBlockReplaceList": {
      const r = await chrome.storage.sync.get([URL_BLOCK_REPLACE_PAGE_KEY]);
      const arr = r[URL_BLOCK_REPLACE_PAGE_KEY];
      return Array.isArray(arr) ? arr : arr ? [arr] : [];
    }
    case "urlBlockAdd": {
      const { type: blockType, url } = msg.data as { type: string; url: string };
      const r = await chrome.storage.sync.get([URL_BLOCK_LIST_KEY]);
      const list: { id: string; type: string; title: string }[] = Array.isArray(r[URL_BLOCK_LIST_KEY])
        ? r[URL_BLOCK_LIST_KEY]
        : [];
      const id = blockType === "bk8" ? String(Date.now()) : `bk_${Date.now()}`;
      list.push({ id, type: blockType, title: url });
      await chrome.storage.sync.set({ [URL_BLOCK_LIST_KEY]: list });
      return { ok: true };
    }
    case "urlBlockRemove": {
      const id = msg.data as string;
      const r = await chrome.storage.sync.get([URL_BLOCK_LIST_KEY]);
      const list: { id: string; type?: string }[] = Array.isArray(r[URL_BLOCK_LIST_KEY])
        ? r[URL_BLOCK_LIST_KEY]
        : [];
      const item = list.find((x) => String(x.id) === String(id));
      if (item && item.type === "bk8") {
        const idNum = Number(item.id);
        if (!Number.isNaN(idNum) && Date.now() - idNum < BK8_EXPIRE_MS) {
          return { ok: false, skipped: true };
        }
      }
      const next = list.filter((x) => String(x.id) !== String(id));
      await chrome.storage.sync.set({ [URL_BLOCK_LIST_KEY]: next });
      return { ok: true };
    }
    case "urlBlockReplaceAdd": {
      const url = msg.data as string;
      const r = await chrome.storage.sync.get([URL_BLOCK_REPLACE_PAGE_KEY]);
      const arr: string[] = Array.isArray(r[URL_BLOCK_REPLACE_PAGE_KEY]) ? r[URL_BLOCK_REPLACE_PAGE_KEY] : [];
      if (!arr.includes(url)) {
        arr.push(url);
        await chrome.storage.sync.set({ [URL_BLOCK_REPLACE_PAGE_KEY]: arr });
      }
      return { ok: true };
    }
    case "urlBlockReplaceRemove": {
      const url = msg.data as string;
      const r = await chrome.storage.sync.get([URL_BLOCK_REPLACE_PAGE_KEY]);
      const arr: string[] = Array.isArray(r[URL_BLOCK_REPLACE_PAGE_KEY]) ? r[URL_BLOCK_REPLACE_PAGE_KEY] : [];
      const next = arr.filter((u) => u !== url);
      await chrome.storage.sync.set({ [URL_BLOCK_REPLACE_PAGE_KEY]: next });
      return { ok: true };
    }
    case "scheduleWorkflowAdvance": {
      const { delayMs, lines, lineIndex } = msg.data as { delayMs: number; lines: unknown[]; lineIndex: number };
      const when = Date.now() + Math.min(Math.max(delayMs, 100), 60_000);
      await chrome.storage.local.set({ [WORKFLOW_ADVANCE_KEY]: { lines: lines ?? [], lineIndex: lineIndex ?? 0 } });
      await chrome.alarms.create("workflowAdvance", { when });
      return { ok: true };
    }
    default:
      return undefined;
  }
}

chrome.runtime.onMessage.addListener(
  (msg: RequestMessage, _sender: chrome.runtime.MessageSender, sendResponse: (r: unknown) => void) => {
    handleRequest(msg).then(sendResponse).catch(() => sendResponse(undefined));
    return true;
  }
);

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "steward") return;
  port.onMessage.addListener((msg: RequestMessage & { id?: number }) => {
    const id = msg.id;
    handleRequest(msg)
      .then((result) => port.postMessage({ id, result }))
      .catch(() => port.postMessage({ id, result: undefined }));
  });
});

// TODO(popup): Popup 模式下工作流仍有诸多限制（关窗后步骤不执行、需列表步骤无法在 background 完成等），后续可考虑：引导用 options/页面模式执行工作流，或在 background 实现「取第一条并打开」等降级逻辑
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "workflowAdvance") return;
  const r = await chrome.storage.local.get(WORKFLOW_ADVANCE_KEY);
  const state = r[WORKFLOW_ADVANCE_KEY] as { lines: { input: string }[]; lineIndex: number } | undefined;
  await chrome.storage.local.remove(WORKFLOW_ADVANCE_KEY);
  if (!state?.lines || !Array.isArray(state.lines) || typeof state.lineIndex !== "number") return;

  let { lines, lineIndex } = state;
  const len = lines.length;

  while (lineIndex < len) {
    const line = lines[lineIndex];
    const input = (line && typeof line === "object" && typeof (line as { input?: string }).input === "string")
      ? (line as { input: string }).input
      : String(line ?? "").trim();
    const trimmed = input.trim();

    if (isWaitStep(trimmed)) {
      const delayMs = parseWaitMs(trimmed);
      const nextIndex = lineIndex + 1;
      const when = Date.now() + Math.min(Math.max(delayMs, 100), 60_000);
      await chrome.storage.local.set({ [WORKFLOW_ADVANCE_KEY]: { lines, lineIndex: nextIndex } });
      await chrome.alarms.create("workflowAdvance", { when });
      return;
    }

    if (isFocusWindowStep(trimmed)) {
      const oneBased = parseFocusWindowIndex(trimmed);
      const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
      const win = windows[oneBased - 1];
      if (win?.id != null) {
        await chrome.windows.update(win.id, { focused: true });
      }
      lineIndex++;
      continue;
    }

    if (isUrlLike(trimmed)) {
      await chrome.tabs.create({ url: toUrl(trimmed) });
      lineIndex++;
      continue;
    }

    // 需要 popup 的步骤（his、bm、tab 等）：保存状态并通知，popup 打开时会继续
    await chrome.storage.local.set({ [WORKFLOW_ADVANCE_KEY]: { lines, lineIndex } });
    chrome.runtime.sendMessage({ action: "workflowAdvance", state: { lines, lineIndex } }).catch(() => {});
    return;
  }

  // 全部在 background 执行完毕，通知 popup 清理状态（若仍打开）
  chrome.runtime.sendMessage({ action: "workflowFinished" }).catch(() => {});
});

chrome.commands.onCommand.addListener((command: string) => {
  if (command === "open-in-content-page") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "openBox" }).catch(() => {
          // 无 content 或未注入时忽略
        });
      }
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Steward v3 installed");
});
