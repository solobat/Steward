/**
 * Steward v3 - Service Worker (MV3)
 * 不持久内存状态，按需从 storage 读取；getHistory/getBookmarks 委托给 commands 实现。
 * 工作流 wait 后由 alarm 触发，可在 background 直接执行 URL 打开、聚焦窗口、下一轮 wait，无需 popup。
 */
import type { Workflow } from "./types/workflow";
import type { AppConfig } from "./types/config";
import type { CacheStatsSnapshot } from "./types/cache";
import type { DiagnosticEvent, DiagnosticEventInput } from "./types/diagnostics";
import type { SettingsBundle } from "./types/settingsBundle";
import type { UsageEventInput } from "./types/usage";
import { handleGetHistory } from "./commands/his/background";
import { handleGetBookmarks } from "./commands/bm/background";
import { isWaitStep, parseWaitMs, isFocusWindowStep, parseFocusWindowIndex, substituteVars, evaluateCondition, parseSetLine } from "./lib/workflow";
import type { ParsedWorkflowLine } from "./types/workflow";
import { isConfigMigrationNeeded, normalizeAppConfig } from "./lib/configRuntime";
import { createDiagnosticEvent, DIAGNOSTICS_KEY, MAX_DIAGNOSTIC_EVENTS, normalizeDiagnosticEvents } from "./lib/diagnostics";
import { MAX_USAGE_RECORDS, normalizeUsageSnapshot, USAGE_RECORDS_KEY } from "./lib/usageRank";
import { LAST_COPY_KEY } from "./lib/clipboardCapture";

const WORKFLOW_ADVANCE_KEY = "workflowAdvanceState";
const CONFIG_KEY = "config";
const CONFIG_MIGRATION_LOG_KEY = "configMigrationLog";
const CUSTOM_COMMAND_MEMORY_KEY = "customCommandMemory";
const REQUEST_CACHE_KEY = "requestCache";
const CACHE_STATS_KEY = "requestCacheStats";
const CACHE_TTL = {
  history: 15_000,
  bookmarks: 15_000,
  tabs: 2_000,
  extensions: 5_000,
  downloads: 3_000,
  topSites: 60_000,
} as const;

type RequestCacheEntry = {
  key: string;
  value: unknown;
  updatedAt: number;
  expiresAt: number;
};

type RequestCacheMap = Record<string, RequestCacheEntry | undefined>;
type CustomCommandMemoryMap = Record<string, string | undefined>;
const MAX_CACHE_STAT_KEYS = 50;

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

/** 快速笔记（local 存储） */
const NOTES_KEY = "notes";
const MAX_NOTES = 200;

/** 实时汇率缓存（open.er-api.com 为主，frankfurter.app 兜底） */
const EXCHANGE_RATES_KEY = "exchangeRates";
const EXCHANGE_RATES_TTL = 60 * 60 * 1000; // 1 小时刷新一次

/** 翻译缓存（Google gtx 端点，本地缓存 7 天） */
const TRANSLATE_CACHE_KEY = "translateCache";
const TRANSLATE_CACHE_MAX = 300;
const TRANSLATE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

type StoredNote = { id: string; text: string; createdAt: number };

type ExchangeRatesEntry = { rates: Record<string, number>; updatedAt: number; source: string };

async function fetchExchangeRates(): Promise<ExchangeRatesEntry | null> {
  const urls = [
    "https://open.er-api.com/v6/latest/USD",
    "https://api.frankfurter.app/latest?from=USD",
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      let rates: Record<string, number> | undefined;
      let source = "";
      if (data && data.result === "success" && data.rates) {
        rates = data.rates;
        source = "open.er-api.com";
      } else if (data && data.base === "USD" && data.rates) {
        rates = data.rates;
        source = "frankfurter.app";
      }
      if (rates) return { rates, updatedAt: Date.now(), source };
    } catch {
      // 尝试下一个源
    }
  }
  return null;
}

/** 读取实时汇率：优先缓存，过期则刷新；全部失败时返回旧缓存或 null */
async function getExchangeRates(): Promise<ExchangeRatesEntry | null> {
  const r = await chrome.storage.local.get(EXCHANGE_RATES_KEY);
  const cached = r[EXCHANGE_RATES_KEY] as ExchangeRatesEntry | undefined;
  if (cached && cached.rates && Date.now() - cached.updatedAt < EXCHANGE_RATES_TTL) {
    return cached;
  }
  const fresh = await fetchExchangeRates();
  if (fresh) {
    await chrome.storage.local.set({ [EXCHANGE_RATES_KEY]: fresh });
    return fresh;
  }
  return cached && cached.rates ? cached : null;
}

type TranslateCacheMap = Record<
  string,
  { text: string; from: string; to: string; ts: number } | undefined
>;

async function readTranslateCache(): Promise<TranslateCacheMap> {
  const r = await chrome.storage.local.get(TRANSLATE_CACHE_KEY);
  const raw = r[TRANSLATE_CACHE_KEY];
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as TranslateCacheMap) : {};
}

/** 翻译：显式目标语言优先；否则含 CJK → en，其余 → zh。Google gtx 端点，7 天本地缓存 */
async function translateText(text: string, targetHint: string): Promise<{ text: string; from: string; to: string } | null> {
  const to = targetHint || (/[\u4e00-\u9fa5]/.test(text) ? "en" : "zh");
  const cacheKey = `${to}:${text}`;
  const cache = await readTranslateCache();
  const hit = cache[cacheKey];
  if (hit && Date.now() - hit.ts < TRANSLATE_CACHE_TTL) {
    return { text: hit.text, from: hit.from, to: hit.to };
  }
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      to
    )}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const translated = Array.isArray(data?.[0])
      ? data[0].map((seg: unknown) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : "")).join("")
      : "";
    const from = typeof data?.[2] === "string" ? data[2] : "auto";
    if (!translated) return null;
    const nextCache: TranslateCacheMap = {};
    let count = 0;
    for (const [k, v] of Object.entries(cache)) {
      if (v && Date.now() - v.ts < TRANSLATE_CACHE_TTL && count < TRANSLATE_CACHE_MAX - 1) {
        nextCache[k] = v;
        count++;
      }
    }
    nextCache[cacheKey] = { text: translated, from, to, ts: Date.now() };
    await chrome.storage.local.set({ [TRANSLATE_CACHE_KEY]: nextCache }).catch(() => {});
    return { text: translated, from, to };
  } catch {
    return null;
  }
}

async function readNotes(): Promise<StoredNote[]> {
  const r = await chrome.storage.local.get(NOTES_KEY);
  const raw = r[NOTES_KEY];
  return Array.isArray(raw) ? raw.filter((n) => n && typeof n.id === "string" && typeof n.text === "string") : [];
}

async function writeNotes(notes: StoredNote[]): Promise<void> {
  await chrome.storage.local.set({ [NOTES_KEY]: notes.slice(0, MAX_NOTES) });
}

/** 相对时间：xx 分钟前 / xx 小时前 / xx 天前 */
function relativeTime(ts?: number): string {
  if (!ts) return "";
  const diffMs = Math.max(0, Date.now() - ts);
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

async function getWorkflowsFromStorage(): Promise<Workflow[]> {
  const r = await chrome.storage.sync.get(WORKFLOWS_KEY);
  const raw = r[WORKFLOWS_KEY];
  return Array.isArray(raw) ? raw : [];
}

async function buildSettingsBundle(): Promise<SettingsBundle> {
  const [config, workflows, blockListResult, replaceListResult] = await Promise.all([
    readNormalizedConfig(),
    getWorkflowsFromStorage(),
    chrome.storage.sync.get([URL_BLOCK_LIST_KEY]),
    chrome.storage.sync.get([URL_BLOCK_REPLACE_PAGE_KEY]),
  ]);

  const urlBlockList = Array.isArray(blockListResult[URL_BLOCK_LIST_KEY])
    ? blockListResult[URL_BLOCK_LIST_KEY]
    : blockListResult[URL_BLOCK_LIST_KEY]
      ? [blockListResult[URL_BLOCK_LIST_KEY]]
      : [];
  const urlBlockReplaceList = Array.isArray(replaceListResult[URL_BLOCK_REPLACE_PAGE_KEY])
    ? replaceListResult[URL_BLOCK_REPLACE_PAGE_KEY].filter((item): item is string => typeof item === "string")
    : typeof replaceListResult[URL_BLOCK_REPLACE_PAGE_KEY] === "string"
      ? [replaceListResult[URL_BLOCK_REPLACE_PAGE_KEY]]
      : [];

  return {
    version: 1,
    exportedAt: Date.now(),
    config,
    workflows,
    urlBlockList,
    urlBlockReplaceList,
  };
}

function normalizeImportedWorkflows(raw: unknown): Workflow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Workflow => !!item && typeof item === "object")
    .map((item) => {
      const workflow = item as Partial<Workflow>;
      return {
        id: typeof workflow.id === "string" ? workflow.id : `wf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title: typeof workflow.title === "string" ? workflow.title : "Imported Workflow",
        desc: typeof workflow.desc === "string" ? workflow.desc : "",
        content: typeof workflow.content === "string" ? workflow.content : "",
        created: typeof workflow.created === "number" ? workflow.created : Date.now(),
        updated: typeof workflow.updated === "number" ? workflow.updated : Date.now(),
      };
    });
}

async function importSettingsBundle(raw: unknown): Promise<{ ok: true; workflows: number }> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid settings bundle");
  }
  const bundle = raw as Partial<SettingsBundle>;
  const config = normalizeAppConfig(bundle.config ?? {});
  const workflows = normalizeImportedWorkflows(bundle.workflows);
  const urlBlockList = Array.isArray(bundle.urlBlockList) ? bundle.urlBlockList : [];
  const urlBlockReplaceList = Array.isArray(bundle.urlBlockReplaceList)
    ? bundle.urlBlockReplaceList.filter((item): item is string => typeof item === "string")
    : [];

  await chrome.storage.sync.set({
    [CONFIG_KEY]: config,
    [WORKFLOWS_KEY]: workflows,
    [URL_BLOCK_LIST_KEY]: urlBlockList,
    [URL_BLOCK_REPLACE_PAGE_KEY]: urlBlockReplaceList,
  });

  await appendDiagnosticEvent({
    level: "info",
    area: "config",
    type: "settings_imported",
    message: "Imported settings bundle",
    metadata: {
      workflows: workflows.length,
      urlBlockList: urlBlockList.length,
      urlBlockReplaceList: urlBlockReplaceList.length,
    },
  });

  return { ok: true, workflows: workflows.length };
}

async function appendConfigMigrationLog(fromVersion: number, toVersion: number): Promise<void> {
  const result = await chrome.storage.local.get(CONFIG_MIGRATION_LOG_KEY);
  const list = Array.isArray(result[CONFIG_MIGRATION_LOG_KEY]) ? result[CONFIG_MIGRATION_LOG_KEY] : [];
  list.unshift({
    timestamp: Date.now(),
    fromVersion,
    toVersion,
  });
  await chrome.storage.local.set({ [CONFIG_MIGRATION_LOG_KEY]: list.slice(0, 20) });
}

async function appendDiagnosticEvent(input: DiagnosticEventInput): Promise<DiagnosticEvent> {
  const event = createDiagnosticEvent(input);
  const result = await chrome.storage.local.get(DIAGNOSTICS_KEY);
  const list = normalizeDiagnosticEvents(result[DIAGNOSTICS_KEY]);
  list.unshift(event);
  await chrome.storage.local.set({ [DIAGNOSTICS_KEY]: list.slice(0, MAX_DIAGNOSTIC_EVENTS) });
  return event;
}

function normalizeRequestCache(raw: unknown): RequestCacheMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: RequestCacheMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const entry = value as Partial<RequestCacheEntry>;
    if (
      typeof entry.key === "string" &&
      typeof entry.updatedAt === "number" &&
      typeof entry.expiresAt === "number"
    ) {
      out[key] = {
        key: entry.key,
        value: entry.value,
        updatedAt: entry.updatedAt,
        expiresAt: entry.expiresAt,
      };
    }
  }
  return out;
}

async function readRequestCache(): Promise<RequestCacheMap> {
  const result = await chrome.storage.local.get(REQUEST_CACHE_KEY);
  return normalizeRequestCache(result[REQUEST_CACHE_KEY]);
}

async function writeRequestCache(cache: RequestCacheMap): Promise<void> {
  await chrome.storage.local.set({ [REQUEST_CACHE_KEY]: cache });
}

function normalizeCacheStats(raw: unknown): CacheStatsSnapshot {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { totalHits: 0, totalMisses: 0, buckets: {}, recentKeys: {} };
  }
  const candidate = raw as Partial<CacheStatsSnapshot>;
  return {
    totalHits: typeof candidate.totalHits === "number" ? candidate.totalHits : 0,
    totalMisses: typeof candidate.totalMisses === "number" ? candidate.totalMisses : 0,
    buckets: candidate.buckets && typeof candidate.buckets === "object" ? candidate.buckets : {},
    recentKeys: candidate.recentKeys && typeof candidate.recentKeys === "object" ? candidate.recentKeys : {},
  };
}

async function readCacheStats(): Promise<CacheStatsSnapshot> {
  const result = await chrome.storage.local.get(CACHE_STATS_KEY);
  return normalizeCacheStats(result[CACHE_STATS_KEY]);
}

async function writeCacheStats(stats: CacheStatsSnapshot): Promise<void> {
  await chrome.storage.local.set({ [CACHE_STATS_KEY]: stats });
}

function inferCacheBucket(key: string): string {
  const idx = key.indexOf(":");
  return idx >= 0 ? key.slice(0, idx) : key;
}

async function recordCacheAccess(key: string, type: "hit" | "miss"): Promise<void> {
  const stats = await readCacheStats();
  const bucket = inferCacheBucket(key);
  const bucketStats = stats.buckets[bucket] ?? { hits: 0, misses: 0 };
  if (type === "hit") {
    stats.totalHits += 1;
    bucketStats.hits += 1;
    const current = stats.recentKeys[key] ?? { key, hits: 0, lastHitAt: 0 };
    stats.recentKeys[key] = {
      key,
      hits: current.hits + 1,
      lastHitAt: Date.now(),
    };
  } else {
    stats.totalMisses += 1;
    bucketStats.misses += 1;
  }
  stats.buckets[bucket] = bucketStats;
  stats.recentKeys = Object.fromEntries(
    Object.entries(stats.recentKeys)
      .sort((a, b) => {
        const hitDiff = (b[1]?.hits ?? 0) - (a[1]?.hits ?? 0);
        if (hitDiff !== 0) return hitDiff;
        return (b[1]?.lastHitAt ?? 0) - (a[1]?.lastHitAt ?? 0);
      })
      .slice(0, MAX_CACHE_STAT_KEYS)
  );
  await writeCacheStats(stats);
}

function buildRequestCacheKey(action: string, data?: unknown): string {
  return `${action}:${JSON.stringify(data ?? null)}`;
}

async function withRequestCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cache = await readRequestCache();
  const hit = cache[key];
  if (hit && hit.expiresAt > now) {
    await recordCacheAccess(key, "hit");
    return hit.value as T;
  }
  await recordCacheAccess(key, "miss");
  const value = await loader();
  cache[key] = {
    key,
    value,
    updatedAt: now,
    expiresAt: now + ttlMs,
  };
  // Drop expired entries opportunistically to keep local storage small.
  const next = Object.fromEntries(
    Object.entries(cache).filter(([, entry]) => entry && entry.expiresAt > now)
  );
  await writeRequestCache(next);
  return value;
}

async function invalidateRequestCache(prefixes: string[]): Promise<void> {
  const cache = await readRequestCache();
  const next = Object.fromEntries(
    Object.entries(cache).filter(([key]) => !prefixes.some((prefix) => key.startsWith(prefix)))
  );
  await writeRequestCache(next);
}

async function readUsageSnapshot() {
  const result = await chrome.storage.local.get(USAGE_RECORDS_KEY);
  return normalizeUsageSnapshot(result[USAGE_RECORDS_KEY]);
}

function normalizeCustomCommandMemory(raw: unknown): CustomCommandMemoryMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw).filter(([, value]) => typeof value === "string")
  );
}

async function readCustomCommandMemory(): Promise<CustomCommandMemoryMap> {
  const result = await chrome.storage.local.get(CUSTOM_COMMAND_MEMORY_KEY);
  return normalizeCustomCommandMemory(result[CUSTOM_COMMAND_MEMORY_KEY]);
}

async function writeCustomCommandMemory(memory: CustomCommandMemoryMap): Promise<void> {
  await chrome.storage.local.set({ [CUSTOM_COMMAND_MEMORY_KEY]: memory });
}

async function bumpUsageRecord(input: UsageEventInput) {
  const snapshot = await readUsageSnapshot();
  const amount = typeof input.amount === "number" && Number.isFinite(input.amount) ? input.amount : 1;
  const prev = snapshot[input.key];
  snapshot[input.key] = {
    key: input.key,
    score: (prev?.score ?? 0) + amount,
    lastUsedAt: Date.now(),
  };
  const trimmed = Object.fromEntries(
    Object.entries(snapshot)
      .sort((a, b) => (b[1]?.lastUsedAt ?? 0) - (a[1]?.lastUsedAt ?? 0))
      .slice(0, MAX_USAGE_RECORDS)
  );
  await chrome.storage.local.set({ [USAGE_RECORDS_KEY]: trimmed });
  return trimmed;
}

async function readNormalizedConfig(): Promise<ReturnType<typeof normalizeAppConfig>> {
  const result = await chrome.storage.sync.get(CONFIG_KEY);
  const raw = result[CONFIG_KEY] as Partial<AppConfig> | undefined;
  const normalized = normalizeAppConfig(raw);
  if (isConfigMigrationNeeded(raw)) {
    const fromVersion = typeof raw?.schemaVersion === "number" ? raw.schemaVersion : 0;
    await chrome.storage.sync.set({ [CONFIG_KEY]: normalized });
    await appendConfigMigrationLog(fromVersion, normalized.schemaVersion);
    await appendDiagnosticEvent({
      level: "info",
      area: "config",
      type: "config_migrated",
      message: `Config migrated from v${fromVersion} to v${normalized.schemaVersion}`,
      metadata: { fromVersion, toVersion: normalized.schemaVersion },
    });
  }
  return normalized;
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
      return readNormalizedConfig();
    case "getData":
      return readNormalizedConfig().then((config) => ({ config }));
    case "exportSettingsBundle":
      return buildSettingsBundle();
    case "importSettingsBundle":
      return importSettingsBundle(msg.data);
    case "getHistory":
      return withRequestCache(buildRequestCacheKey("getHistory"), CACHE_TTL.history, () => handleGetHistory());
    case "getBookmarks":
      return withRequestCache(buildRequestCacheKey("getBookmarks"), CACHE_TTL.bookmarks, () => handleGetBookmarks());
    case "getBookmarkFolder": {
      const folderId = (msg.data as string) ?? "1";
      return getBookmarkFolderLeaves(folderId).catch(() => []);
    }
    case "saveLastQuery":
      return chrome.storage.local.set({ lastQuery: msg.data }).then(() => ({ ok: true }));
    case "getLastQuery":
      return chrome.storage.local.get("lastQuery").then((r) => r.lastQuery ?? "");
    case "getCustomCommandMemory": {
      const commandId = typeof msg.data === "string" ? msg.data : "";
      const memory = await readCustomCommandMemory();
      return memory[commandId] ?? "";
    }
    case "saveCustomCommandMemory": {
      const payload = msg.data as { commandId?: string; query?: string } | undefined;
      const commandId = typeof payload?.commandId === "string" ? payload.commandId : "";
      const query = typeof payload?.query === "string" ? payload.query : "";
      if (!commandId) return { ok: false };
      const memory = await readCustomCommandMemory();
      if (query.trim()) {
        memory[commandId] = query;
      } else {
        delete memory[commandId];
      }
      await writeCustomCommandMemory(memory);
      return { ok: true };
    }
    case "saveConfig":
      return chrome.storage.sync
        .set({ [CONFIG_KEY]: normalizeAppConfig(msg.data as Partial<AppConfig>) })
        .then(() => ({ ok: true }));
    case "logDiagnosticEvent":
      return appendDiagnosticEvent(msg.data as DiagnosticEventInput).then((event) => ({ ok: true, event }));
    case "getDiagnosticEvents": {
      const result = await chrome.storage.local.get(DIAGNOSTICS_KEY);
      return normalizeDiagnosticEvents(result[DIAGNOSTICS_KEY]);
    }
    case "clearDiagnosticEvents":
      await chrome.storage.local.set({ [DIAGNOSTICS_KEY]: [] });
      return { ok: true };
    case "getCacheStats":
      return readCacheStats();
    case "getUsageSnapshot":
      return readUsageSnapshot();
    case "recordUsage":
      return bumpUsageRecord(msg.data as UsageEventInput).then((snapshot) => ({ ok: true, snapshot }));
    case "getNotes":
      return readNotes();
    case "addNote": {
      const text = typeof msg.data === "string" ? msg.data.trim() : "";
      if (!text) return { ok: false, note: null };
      const note: StoredNote = { id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, createdAt: Date.now() };
      const notes = await readNotes();
      await writeNotes([note, ...notes]);
      return { ok: true, note };
    }
    case "deleteNotesByText": {
      const kw = typeof msg.data === "string" ? msg.data.trim() : "";
      const notes = await readNotes();
      const remaining = kw ? notes.filter((n) => !n.text.includes(kw)) : [];
      await writeNotes(remaining);
      return { deleted: notes.length - remaining.length };
    }
    case "clearNotes":
      await writeNotes([]);
      return { ok: true };
    case "getLastCopiedText": {
      const r = await chrome.storage.local.get(LAST_COPY_KEY);
      return typeof r[LAST_COPY_KEY] === "string" ? r[LAST_COPY_KEY] : "";
    }
    case "getExchangeRates":
      return getExchangeRates();
    case "translate": {
      const { text, target } = (msg.data as { text?: string; target?: string }) ?? {};
      const t = typeof text === "string" ? text.trim() : "";
      if (!t) return null;
      return translateText(t, typeof target === "string" ? target : "");
    }
    case "chatComplete": {
      const prompt = typeof msg.data === "string" ? msg.data.trim() : "";
      if (!prompt) return { ok: false, error: "Empty prompt" };
      const cfg = await readNormalizedConfig();
      const ai = cfg.general.ai ?? {};
      const baseUrl = (ai.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, "");
      const apiKey = ai.apiKey ?? "";
      const model = ai.model ?? "gpt-4o-mini";
      if (!apiKey) {
        return { ok: false, error: "API key not configured (Settings → General → AI)" };
      }
      try {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            stream: false,
          }),
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) {
          return { ok: false, error: `HTTP ${res.status}` };
        }
        const data = await res.json();
        const out = data?.choices?.[0]?.message?.content ?? "";
        return out ? { ok: true, text: out } : { ok: false, error: "Empty response" };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    }
    case "getActiveTab": {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      return tab ? { title: tab.title ?? "", url: tab.url ?? "" } : null;
    }
    case "openIncognito": {
      const url = typeof msg.data === "string" ? msg.data : "";
      if (url) await chrome.windows.create({ url, incognito: true });
      return { ok: true };
    }
    case "openNewWindow": {
      const url = typeof msg.data === "string" ? msg.data : "";
      if (url) await chrome.windows.create({ url });
      return { ok: true };
    }
    case "openBoxWithQuery": {
      // 深链：在活动标签页打开页面内命令框并填入查询词
      const query = typeof msg.data === "string" ? msg.data : "";
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id != null) {
        await chrome.tabs
          .sendMessage(tabs[0].id, { action: "openBoxWithQuery", query })
          .catch(() => {});
        return { ok: true };
      }
      return { ok: false };
    }
    case "getClosedSessions": {
      const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 25 });
      const list = (sessions ?? [])
        .map((s) => {
          const sessionId = (s as chrome.sessions.Session & { sessionId?: string }).sessionId ?? "";
          if (s.tab) {
            return {
              sessionId,
              title: s.tab.title || s.tab.url || "",
              url: s.tab.url,
              type: "tab" as const,
              timeAgo: relativeTime(s.lastModified),
            };
          }
          if (s.window) {
            return {
              sessionId,
              title: `Window · ${s.window.tabs?.length ?? 0} tabs`,
              type: "window" as const,
              timeAgo: relativeTime(s.lastModified),
            };
          }
          return null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x);
      return list;
    }
    case "restoreSession": {
      const sessionId = typeof msg.data === "string" ? msg.data : "";
      if (sessionId) await chrome.sessions.restore(sessionId);
      return { ok: true };
    }
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
      return withRequestCache(buildRequestCacheKey("getTabs", { query }), CACHE_TTL.tabs, async () => {
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
      });
    }
    case "tabActivate": {
      const tabId = msg.data as number;
      await chrome.tabs.update(tabId, { active: true });
      await invalidateRequestCache(["getTabs:"]);
      return { ok: true };
    }
    case "tabClose": {
      const ids = Array.isArray(msg.data) ? (msg.data as number[]) : [msg.data as number];
      await chrome.tabs.remove(ids.filter((id) => typeof id === "number"));
      await invalidateRequestCache(["getTabs:"]);
      return { ok: true };
    }
    case "tabMove": {
      const { tabId, index } = msg.data as { tabId: number; index: number };
      await chrome.tabs.move(tabId, { index });
      await invalidateRequestCache(["getTabs:"]);
      return { ok: true };
    }
    case "tabPin": {
      const { tabId, pinned } = msg.data as { tabId: number; pinned: boolean };
      await chrome.tabs.update(tabId, { pinned });
      await invalidateRequestCache(["getTabs:"]);
      return { ok: true };
    }
    case "tabMute": {
      const { tabId, muted } = msg.data as { tabId: number; muted: boolean };
      await chrome.tabs.update(tabId, { muted });
      await invalidateRequestCache(["getTabs:"]);
      return { ok: true };
    }
    case "getExtensions": {
      const { enabled, query: q } = (msg.data as { enabled?: boolean; query?: string }) ?? {};
      return withRequestCache(buildRequestCacheKey("getExtensions", { enabled, query: q }), CACHE_TTL.extensions, async () => {
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
      });
    }
    case "extEnable": {
      const id = msg.data as string;
      await chrome.management.setEnabled(id, true);
      await invalidateRequestCache(["getExtensions:"]);
      return { ok: true };
    }
    case "extDisable": {
      const id = msg.data as string;
      await chrome.management.setEnabled(id, false);
      await invalidateRequestCache(["getExtensions:"]);
      return { ok: true };
    }
    case "extUninstall": {
      const id = msg.data as string;
      await chrome.management.uninstall(id);
      await invalidateRequestCache(["getExtensions:"]);
      return { ok: true };
    }
    case "getDownloads": {
      const query = (msg.data as { query?: string })?.query ?? [];
      return withRequestCache(buildRequestCacheKey("getDownloads", { query }), CACHE_TTL.downloads, async () => {
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
      });
    }
    case "downloadShow": {
      const id = msg.data as number;
      await chrome.downloads.show(id);
      return { ok: true };
    }
    case "downloadPause": {
      const id = msg.data as number;
      await chrome.downloads.pause(id);
      await invalidateRequestCache(["getDownloads:"]);
      return { ok: true };
    }
    case "downloadResume": {
      const id = msg.data as number;
      await chrome.downloads.resume(id);
      await invalidateRequestCache(["getDownloads:"]);
      return { ok: true };
    }
    case "downloadCancel": {
      const id = msg.data as number;
      await chrome.downloads.cancel(id);
      await invalidateRequestCache(["getDownloads:"]);
      return { ok: true };
    }
    case "getTopSites": {
      return withRequestCache(buildRequestCacheKey("getTopSites"), CACHE_TTL.topSites, async () => {
        const sites = await chrome.topSites.get();
        return (sites ?? []).map((s) => ({ url: s.url, title: s.title }));
      });
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
      const { delayMs, lines, lineIndex, vars } = msg.data as {
        delayMs: number;
        lines: unknown[];
        lineIndex: number;
        vars?: Record<string, string>;
      };
      const when = Date.now() + Math.min(Math.max(delayMs, 100), 60_000);
      await chrome.storage.local.set({
        [WORKFLOW_ADVANCE_KEY]: { lines: lines ?? [], lineIndex: lineIndex ?? 0, vars: vars ?? {} },
      });
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
  const state = r[WORKFLOW_ADVANCE_KEY] as
    | { lines: ParsedWorkflowLine[]; lineIndex: number; vars?: Record<string, string> }
    | undefined;
  await chrome.storage.local.remove(WORKFLOW_ADVANCE_KEY);
  if (!state?.lines || !Array.isArray(state.lines) || typeof state.lineIndex !== "number") return;

  const lines = state.lines;
  let lineIndex = state.lineIndex;
  const vars: Record<string, string> = state.vars ?? {};
  const len = lines.length;

  while (lineIndex < len) {
    const line = lines[lineIndex];
    const raw = line && typeof line === "object" && typeof line.input === "string" ? line.input : "";
    const input = substituteVars(raw, vars, line?.iteration);
    const trimmed = input.trim();

    // 控制行：set / copy / note+ / if / end
    if (line?.control === "set") {
      const kv = parseSetLine(input);
      if (kv) vars[kv[0]] = kv[1];
      lineIndex++;
      continue;
    }
    if (line?.control === "copy") {
      const text = input.replace(/^copy\s+/i, "");
      await chrome.storage.local.set({ lastCopiedText: text.slice(0, 20000) });
      lineIndex++;
      continue;
    }
    if (line?.control === "note") {
      const text = input.replace(/^note\+\s+/i, "").trim();
      if (text) {
        const notes = await readNotes();
        await writeNotes([
          { id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, createdAt: Date.now() },
          ...notes,
        ]);
      }
      lineIndex++;
      continue;
    }
    if (line?.control === "if" && line.condition) {
      const condTrue = evaluateCondition(line.condition, vars, line.iteration);
      if (!condTrue && typeof line.ifSkipTo === "number" && line.ifSkipTo >= 0) {
        lineIndex = line.ifSkipTo + 1;
      } else {
        lineIndex++;
      }
      continue;
    }
    if (line?.control === "end") {
      lineIndex++;
      continue;
    }

    if (isWaitStep(trimmed)) {
      const delayMs = parseWaitMs(trimmed);
      const nextIndex = lineIndex + 1;
      const when = Date.now() + Math.min(Math.max(delayMs, 100), 60_000);
      await chrome.storage.local.set({ [WORKFLOW_ADVANCE_KEY]: { lines, lineIndex: nextIndex, vars } });
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
    await chrome.storage.local.set({ [WORKFLOW_ADVANCE_KEY]: { lines, lineIndex, vars } });
    chrome.runtime.sendMessage({ action: "workflowAdvance", state: { lines, lineIndex, vars } }).catch(() => {});
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
