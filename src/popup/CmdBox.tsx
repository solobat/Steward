import { Fragment, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { TRIGGERS, type Command, type DataMode, type ResultItem, type LoadContext } from "../commands";
import { isCalculableExpression, isConversionExpression } from "../commands/calculate";
import { isUrlLike } from "../commands/openurl";
import { request } from "@/lib/portBridge";
import { customCommandsToCommands } from "@/lib/customCommands";
import { t as i18nT } from "@/lib/i18n";
import { DEFAULT_CONFIG, type AppearanceConfig, type CustomCommand, type SearchConfig } from "@/types/config";
import { parseWorkflow, fixNumber, isWaitStep, parseWaitMs, isFocusWindowStep, parseFocusWindowIndex, substituteVars, evaluateCondition, parseSetLine, buildBuiltinVars } from "@/lib/workflow";
import { CHROME_PAGES, filterChromePages } from "@/lib/chromePages";
import type { ParsedWorkflowLine } from "@/types/workflow";
import { getCommandAvailability } from "@/lib/commandAvailability";
import { fuzzyRank, ensurePinyin } from "@/lib/fuzzy";
import type { DiagnosticEventInput } from "@/types/diagnostics";
import { createStateItem, isStateItem } from "@/lib/resultState";
import type { UsageSnapshot } from "@/types/usage";
import { buildUsageKey, sortItemsByUsage } from "@/lib/usageRank";

const isInIframe = (): boolean => {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true;
  }
};

/**
 * 解析命令：Alfred 式 "trigger + 空格 + 过滤词"
 * 支持自定义搜索：关键词 + 空格 + 搜索词；无匹配时用默认搜索引擎兜底。
 * hasMainModeExtraMatches(trimmed)：当主模式除命令外还有匹配项（如 Chrome 内置页）时返回 true，避免被默认搜索抢走。
 */
function parseQuery(
  query: string,
  triggers: Command[],
  searchConfig?: SearchConfig | null,
  hasMainModeExtraMatches?: (trimmed: string) => boolean,
  hasUnavailableTriggerPrefix?: (trimmed: string) => boolean,
  hasUnavailableTriggerKey?: (triggerKey: string) => boolean
): {
  inSearchMode: boolean;
  triggerKey: string;
  filter: string;
  trigger: Command | null;
  searchKeyword?: string;
} {
  const m = query.match(/^(\w+)\s/);
  if (!m) {
    const trigger = triggers.find((t) => t.key === query.trim() || query.trim().startsWith(t.key));
    if (trigger)
      return { inSearchMode: false, triggerKey: "", filter: "", trigger };
    const trimmed = query.trim();
    // 输入是某命令 key 的前缀时（如 b 对应 bm/bks），不进入搜索，留在主模式显示匹配命令列表
    if (
      trimmed &&
      (triggers.some((t) => t.key.toLowerCase().startsWith(trimmed.toLowerCase())) ||
        hasUnavailableTriggerPrefix?.(trimmed))
    )
      return { inSearchMode: false, triggerKey: "", filter: "", trigger: null };
    const calcCmd = triggers.find((t) => t.id === "calculate");
    if (calcCmd && trimmed && (isCalculableExpression(trimmed) || isConversionExpression(trimmed)))
      return { inSearchMode: true, triggerKey: "", filter: trimmed, trigger: calcCmd };
    const openurlCmd = triggers.find((t) => t.id === "openurl");
    if (openurlCmd && trimmed && isUrlLike(trimmed))
      return { inSearchMode: true, triggerKey: "", filter: trimmed, trigger: openurlCmd };
    const searchCmd = triggers.find((t) => t.id === "search");
    if (searchCmd && searchConfig?.searchEngines?.length) {
      for (const e of searchConfig.searchEngines) {
        const kw = e.keyword.trim();
        if (!kw) continue;
        const prefix = kw + " ";
        if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
          const rest = trimmed.slice(prefix.length).trim();
          if (rest) return { inSearchMode: true, triggerKey: "", filter: rest, trigger: searchCmd, searchKeyword: e.keyword };
        }
      }
      // 有输入且无关键词匹配时走默认搜索；若主模式有其它匹配（如 Chrome 内置页），则留在主模式
      if (searchConfig.defaultSearchKeyword && trimmed) {
        if (hasMainModeExtraMatches?.(trimmed)) return { inSearchMode: false, triggerKey: "", filter: "", trigger: null };
        return { inSearchMode: true, triggerKey: "", filter: trimmed, trigger: searchCmd, searchKeyword: searchConfig.defaultSearchKeyword };
      }
    }
    return { inSearchMode: false, triggerKey: "", filter: "", trigger: null };
  }
  const triggerKey = m[1];
  const filter = query.slice(m[0].length);
  let trigger = triggers.find((t) => t.key === triggerKey) ?? null;
  let searchKeyword: string | undefined;
  if (!trigger && hasUnavailableTriggerKey?.(triggerKey)) {
    return { inSearchMode: false, triggerKey, filter, trigger: null };
  }
  if (!trigger && searchConfig?.searchEngines?.length) {
    const engine = searchConfig.searchEngines.find((e) => e.keyword.trim().toLowerCase() === triggerKey.toLowerCase());
    if (engine && filter.trim()) {
      const searchCmd = triggers.find((t) => t.id === "search");
      if (searchCmd) {
        trigger = searchCmd;
        searchKeyword = engine.keyword;
      }
    }
  }
  return {
    inSearchMode: !!(trigger && (trigger.mode || trigger.action || trigger.loadWorkflows || trigger.load || trigger.getResultFromFilter)),
    triggerKey,
    filter,
    trigger,
    ...(searchKeyword !== undefined && { searchKeyword }),
  };
}

interface MetaItem {
  title: string;
  desc: string;
  key: string;
}

function metaToResultItems(meta: MetaItem[]): ResultItem[] {
  return meta.map((m, i) => ({
    id: `meta-${i}`,
    title: m.title,
    desc: m.desc,
    copyValue: m.desc,
  }));
}

/**
 * 圆角（px）：
 * - 弹窗模式：贴合 popup 外框的小圆角（sharp 0 / default 6 / round 10）
 * - 页面内模式：命令框贴满 iframe，外圆角由 iframe 容器提供，内部保持直角
 */
function boxRadiusPx(cornerRadius: string | undefined, inPage: boolean): number {
  if (inPage) return 0;
  if (cornerRadius === "sharp") return 0;
  if (cornerRadius === "round") return 10;
  return 6;
}

function appearanceSizeToPx(
  size: string | undefined,
  kind: "inputHeight" | "title" | "subtitle"
): string {
  if (kind === "inputHeight") {
    if (size === "small") return "32px";
    if (size === "large") return "48px";
    return "40px";
  }
  if (kind === "title") {
    if (size === "small") return "12px";
    if (size === "large") return "16px";
    return "14px";
  }
  if (kind === "subtitle") {
    if (size === "small") return "10px";
    if (size === "large") return "13px";
    return "12px";
  }
  return kind === "inputHeight" ? "40px" : kind === "title" ? "14px" : "12px";
}

function getStateTone(item: ResultItem | null | undefined): string | null {
  if (!item?.stateType) return null;
  if (item.stateType === "error" || item.stateType === "timeout") return "text-error";
  if (item.stateType === "unavailable") return "text-warning";
  return "text-base-content/60";
}

type QueryStatus = "idle" | "loading" | "ready" | "empty" | "error" | "timeout";
type QueryPerfSession = {
  sessionId: number;
  startedAt: number;
  query: string;
  triggerId?: string | null;
  filter?: string;
  firstResultLogged: boolean;
};

function getQueryStateFromItems(items: ResultItem[], fallback: QueryStatus = "ready"): {
  status: QueryStatus;
  code?: string;
  message?: string;
} {
  const first = items[0];
  if (!first) return { status: fallback };
  if (!first.stateType) return { status: "ready" };
  if (first.stateType === "timeout") {
    return { status: "timeout", code: first.stateCode, message: first.title };
  }
  if (first.stateType === "error") {
    return { status: "error", code: first.stateCode, message: first.title };
  }
  return { status: "empty", code: first.stateCode, message: first.title };
}

export default function CmdBox({ appearance }: { appearance?: AppearanceConfig }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inPage = isInIframe();
  const radiusPx = boxRadiusPx(appearance?.cornerRadius, inPage);
  const boxBg =
    appearance?.boxBackground && /^#[0-9A-Fa-f]{6}$/.test(appearance.boxBackground)
      ? appearance.boxBackground
      : undefined;
  const inputHeightPx = appearanceSizeToPx(appearance?.inputHeight, "inputHeight");
  const titleSizePx = appearanceSizeToPx(appearance?.titleSize, "title");
  const subtitleSizePx = appearanceSizeToPx(appearance?.subtitleSize, "subtitle");
  const selectedItemRef = useRef<HTMLAnchorElement | null>(null);
  const pageResponseSessionRef = useRef<{ kind: "META" | "NAVS" | "OUTLINE"; sessionId: number } | null>(null);
  const queryTimeoutRef = useRef<number | null>(null);
  const [effectiveTriggers, setEffectiveTriggers] = useState<Command[]>(TRIGGERS);
  const [query, setQuery] = useState("");
  const clearQueryTimeout = useCallback(() => {
    if (queryTimeoutRef.current != null) {
      window.clearTimeout(queryTimeoutRef.current);
      queryTimeoutRef.current = null;
    }
  }, []);
  const commandToItem = useCallback((cmd: Command): ResultItem => {
    const availability = getCommandAvailability(cmd, { inPage });
    const isCustom = cmd.id.startsWith("custom-");
    const title = isCustom ? `${cmd.key}  ${cmd.title}` : `${cmd.key}  ${i18nT(`cmd_${cmd.id}_title`) || cmd.title}`;
    const baseDesc = isCustom ? (cmd.desc ?? "") : (i18nT(`cmd_${cmd.id}_desc`) || cmd.desc) ?? "";
    return {
      id: cmd.id,
      title,
      desc: availability.available ? baseDesc : [baseDesc, availability.reason].filter(Boolean).join(" · "),
      disabled: !availability.available,
      disabledReason: availability.reason,
    };
  }, [inPage]);
  const availableTriggers = useMemo(
    () => effectiveTriggers.filter((t) => getCommandAvailability(t, { inPage }).available),
    [effectiveTriggers, inPage]
  );
  const [items, setItems] = useState<ResultItem[]>(() =>
    TRIGGERS.filter((t) => getCommandAvailability(t, { inPage }).available).map(commandToItem)
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [queryState, setQueryState] = useState<{ status: QueryStatus; code?: string; message?: string }>({
    status: "idle",
  });
  const [usageSnapshot, setUsageSnapshot] = useState<UsageSnapshot>({});
  // 预加载拼音表（独立 chunk 懒加载，供中文模糊匹配）
  useEffect(() => {
    ensurePinyin();
  }, []);
  const [mode, setMode] = useState<"main" | DataMode>("main");
  const [subList, setSubList] = useState<ResultItem[]>([]);
  /** 结果操作菜单：选中项按 → 展开动作列表，← / Esc 返回 */
  const [actionsFor, setActionsFor] = useState<{ parentItems: ResultItem[]; parentIndex: number } | null>(null);
  const [searchConfig, setSearchConfig] = useState<SearchConfig | null>(null);
  const loadedModeRef = useRef<DataMode | null>(null);
  const historyPendingRef = useRef(false);
  const bookmarksPendingRef = useRef(false);
  const itemsRef = useRef<ResultItem[]>(items);
  const selectedIndexRef = useRef(selectedIndex);
  const queryRef = useRef(query);
  queryRef.current = query;
  const workflowRunRef = useRef<{
    lines: ParsedWorkflowLine[];
    lineIndex: number;
    inputForCurrentLine: string;
    vars: Record<string, string>;
  } | null>(null);
  const executedLineRef = useRef(-1);
  const loadedWorkflowsRef = useRef(false);
  const loadedTriggerKeyRef = useRef<string | null>(null);
  const loadedFilterRef = useRef<string | null>(null);
  const lastGetResultFromFilterRef = useRef<{ triggerId: string; filter: string; searchKeyword?: string } | null>(null);
  const triggerIdRef = useRef<string | null>(null);
  const querySessionRef = useRef(0);
  const querySessionKeyRef = useRef<string | null>(null);
  const queryPerfRef = useRef<QueryPerfSession | null>(null);
  itemsRef.current = items;
  selectedIndexRef.current = selectedIndex;

  const startQuerySession = useCallback((key: string) => {
    querySessionKeyRef.current = key;
    querySessionRef.current += 1;
    return querySessionRef.current;
  }, []);

  const isQuerySessionActive = useCallback((sessionId: number) => querySessionRef.current === sessionId, []);
  const logDiagnostic = useCallback((event: DiagnosticEventInput) => {
    request({ action: "logDiagnosticEvent", data: event }).catch(() => {});
  }, []);
  const recordUsage = useCallback((key: string | null, amount = 1) => {
    if (!key) return;
    setUsageSnapshot((prev) => {
      const current = prev[key];
      return {
        ...prev,
        [key]: {
          key,
          score: (current?.score ?? 0) + amount,
          lastUsedAt: Date.now(),
        },
      };
    });
    request<{ snapshot?: UsageSnapshot }>({ action: "recordUsage", data: { key, amount } })
      .then((res) => {
        if (res?.snapshot) setUsageSnapshot(res.snapshot);
      })
      .catch(() => {});
  }, []);
  const beginQueryPerf = useCallback((sessionId: number, payload: { query: string; triggerId?: string | null; filter?: string }) => {
    queryPerfRef.current = {
      sessionId,
      startedAt: performance.now(),
      query: payload.query,
      triggerId: payload.triggerId,
      filter: payload.filter,
      firstResultLogged: false,
    };
  }, []);
  const completeQueryPerf = useCallback((sessionId: number, status: "ready" | "empty" | "error" | "timeout", itemCount: number) => {
    const perf = queryPerfRef.current;
    if (!perf || perf.sessionId !== sessionId) return;
    const elapsedMs = Math.round(performance.now() - perf.startedAt);
    if (!perf.firstResultLogged) {
      perf.firstResultLogged = true;
      logDiagnostic({
        level: "info",
        area: "query",
        type: "query_perf_first_result",
        message: `First result in ${elapsedMs}ms`,
        metadata: {
          query: perf.query,
          triggerId: perf.triggerId,
          filter: perf.filter,
          elapsedMs,
          itemCount,
          status,
        },
      });
    }
    logDiagnostic({
      level: status === "error" || status === "timeout" ? "warn" : "info",
      area: "query",
      type: "query_perf_complete",
      message: `Query finished in ${elapsedMs}ms`,
      metadata: {
        query: perf.query,
        triggerId: perf.triggerId,
        filter: perf.filter,
        elapsedMs,
        itemCount,
        status,
      },
    });
    queryPerfRef.current = null;
  }, [logDiagnostic]);
  const logCommandPerf = useCallback((type: string, startedAt: number, metadata?: Record<string, unknown>) => {
    const elapsedMs = Math.round(performance.now() - startedAt);
    logDiagnostic({
      level: "info",
      area: "command",
      type,
      message: `Command action finished in ${elapsedMs}ms`,
      metadata: { elapsedMs, ...metadata },
    });
  }, [logDiagnostic]);
  const applyItemsWithState = useCallback((nextItems: ResultItem[], fallback: QueryStatus = "ready") => {
    const hasStateOnly = nextItems.length <= 1 && !!nextItems[0]?.stateType;
    const sorted = hasStateOnly ? nextItems : sortItemsByUsage(nextItems, usageSnapshot);
    const nextState = getQueryStateFromItems(sorted, fallback);
    setItems(sorted);
    setQueryState(nextState);
    const perf = queryPerfRef.current;
    if (perf && perf.sessionId === querySessionRef.current && nextState.status !== "loading" && nextState.status !== "idle") {
      completeQueryPerf(perf.sessionId, nextState.status, sorted.filter((item) => !item.stateType).length);
    }
  }, [completeQueryPerf, usageSnapshot]);

  const createGuardedLoadContext = useCallback(
    (sessionId: number, pendingRef: { current: boolean }): LoadContext => ({
      setLoading: (v) => {
        if (!isQuerySessionActive(sessionId)) return;
        if (!v) clearQueryTimeout();
        if (v) setQueryState({ status: "loading" });
      },
      setMode: (nextMode) => {
        if (!isQuerySessionActive(sessionId)) return;
        setMode(nextMode);
      },
      setSubList: (nextItems) => {
        if (!isQuerySessionActive(sessionId)) return;
        clearQueryTimeout();
        setSubList(nextItems);
      },
      setItems: (nextItems) => {
        if (!isQuerySessionActive(sessionId)) return;
        clearQueryTimeout();
        applyItemsWithState(nextItems);
      },
      setSelectedIndex: (index) => {
        if (!isQuerySessionActive(sessionId)) return;
        setSelectedIndex(index);
      },
      pendingRef,
    }),
    [applyItemsWithState, clearQueryTimeout, isQuerySessionActive]
  );

  const armQueryTimeout = useCallback((sessionId: number, title?: string, desc?: string) => {
    clearQueryTimeout();
    queryTimeoutRef.current = window.setTimeout(() => {
      if (!isQuerySessionActive(sessionId)) return;
      pageResponseSessionRef.current = null;
      setSubList([]);
      applyItemsWithState([createStateItem("timeout", { title, desc, code: "query_timeout" })]);
      setSelectedIndex(0);
      logDiagnostic({
        level: "error",
        area: "query",
        type: "query_timeout",
        message: title ?? "Request timed out",
        metadata: { query: queryRef.current, sessionId, desc },
      });
    }, 4000);
  }, [applyItemsWithState, clearQueryTimeout, isQuerySessionActive, logDiagnostic]);

  const hasMainModeExtraMatches = useCallback(
    (trimmed: string) => filterChromePages(CHROME_PAGES, trimmed, i18nT).length > 0,
    []
  );
  const hasUnavailableTriggerPrefix = useCallback(
    (trimmed: string) =>
      effectiveTriggers.some((t) => {
        const availability = getCommandAvailability(t, { inPage });
        return !availability.available && t.key.toLowerCase().startsWith(trimmed.toLowerCase());
      }),
    [effectiveTriggers, inPage]
  );
  const hasUnavailableTriggerKey = useCallback(
    (triggerKeyValue: string) =>
      effectiveTriggers.some((t) => {
        const availability = getCommandAvailability(t, { inPage });
        return !availability.available && t.key.toLowerCase() === triggerKeyValue.toLowerCase();
      }),
    [effectiveTriggers, inPage]
  );
  const { inSearchMode, filter, trigger, searchKeyword } = parseQuery(
    query,
    availableTriggers,
    searchConfig,
    hasMainModeExtraMatches,
    hasUnavailableTriggerPrefix,
    hasUnavailableTriggerKey
  );
  const triggerId = trigger?.id ?? null;
  const triggerKey = trigger?.key ?? null;
  triggerIdRef.current = triggerId;

  useEffect(() => {
    Promise.all([
      request<{ config?: { general?: { cacheLastCmd?: boolean }; plugins?: Record<string, { disabled?: boolean; triggerKey?: string }>; search?: SearchConfig; customCommands?: { list?: CustomCommand[] } } }>({ action: "getData" }),
      request<string>({ action: "getLastQuery" }),
      request<UsageSnapshot>({ action: "getUsageSnapshot" }),
    ])
      .then(([data, lastQuery, usage]) => {
        const config = data?.config;
        if (config?.general?.cacheLastCmd && typeof lastQuery === "string" && lastQuery) {
          setQuery(lastQuery);
        }
        setUsageSnapshot(usage ?? {});
        const plugins = config?.plugins ?? {};
        const builtin = TRIGGERS.filter((t) => !plugins[t.id]?.disabled).map((t) => {
          const custom = plugins[t.id]?.triggerKey?.trim();
          const key = custom && custom.length > 0 ? custom : t.key;
          return { ...t, key };
        });
        const customList = config?.customCommands?.list ?? [];
        setEffectiveTriggers([...builtin, ...customCommandsToCommands(customList)]);
        const base = DEFAULT_CONFIG.search;
        setSearchConfig(base ? { ...base, ...config?.search } : (config?.search ?? null));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    const t = setTimeout(focusInput, 80);
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes.stewardFocus) focusInput();
      if (areaName === "sync") {
        if (changes.workflows) {
          loadedWorkflowsRef.current = false;
          if (triggerIdRef.current === "wf") setSubList([]);
        }
        if (changes.config) {
          request<{ config?: { plugins?: Record<string, { disabled?: boolean; triggerKey?: string }>; search?: SearchConfig; customCommands?: { list?: CustomCommand[] } } }>({ action: "getData" }).then((data) => {
            const plugins = data?.config?.plugins ?? {};
            const builtin = TRIGGERS.filter((t) => !plugins[t.id]?.disabled).map((t) => {
              const custom = plugins[t.id]?.triggerKey?.trim();
              const key = custom && custom.length > 0 ? custom : t.key;
              return { ...t, key };
            });
            const customList = data?.config?.customCommands?.list ?? [];
            setEffectiveTriggers([...builtin, ...customCommandsToCommands(customList)]);
            const base = DEFAULT_CONFIG.search;
            setSearchConfig(base ? { ...base, ...data?.config?.search } : (data?.config?.search ?? null));
          }).catch(() => {});
        }
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      clearTimeout(t);
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (mode !== "main" || !query.trim()) return;
    const t = setTimeout(() => {
      request<{ config?: { general?: { cacheLastCmd?: boolean } } }>({ action: "getData" }).then((data) => {
        if (data?.config?.general?.cacheLastCmd) {
          request({ action: "saveLastQuery", data: query }).catch(() => {});
        }
      });
    }, 400);
    return () => clearTimeout(t);
  }, [query, mode]);

  const notifyClose = useCallback(() => {
    if (!isInIframe()) {
      window.close();
      return;
    }
    try {
      if (window.opener) window.opener.postMessage({ action: "CLOSE_BOX" }, "*");
      window.parent.postMessage({ action: "CLOSE_BOX" }, "*");
    } catch {
      // ignore
    }
  }, []);

  /** 兜底：快捷键失效时从弹窗转发「页面内打开」到内容脚本 */
  const openInPageBox = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id != null) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "openBox" }).catch(() => {});
      }
    });
    window.close();
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    // 记录最近复制的文本，供 txt 工具与工作流 {{clipboard}} 使用
    chrome.storage.local.set({ lastCopiedText: text.slice(0, 20000) }).catch(() => {});
  }, []);

  const loadForMode = useCallback((dataMode: DataMode) => {
    const cmd = availableTriggers.find((t) => t.mode === dataMode);
    if (!cmd?.load) return;
    const pendingRef =
      dataMode === "history"
        ? historyPendingRef
        : dataMode === "bookmarks"
          ? bookmarksPendingRef
          : { current: false };
    const sessionKey = `mode:${dataMode}:${queryRef.current}`;
    const sessionId = startQuerySession(sessionKey);
    beginQueryPerf(sessionId, { query: queryRef.current, triggerId: cmd.id, filter: queryRef.current.trim() });
    armQueryTimeout(sessionId, "Command timed out", "The command did not return data in time");
    pageResponseSessionRef.current =
      dataMode === "pageMeta"
        ? { kind: "META", sessionId }
        : dataMode === "pageNavs"
          ? { kind: "NAVS", sessionId }
          : dataMode === "pageOutline"
            ? { kind: "OUTLINE", sessionId }
            : null;
    const ctx = createGuardedLoadContext(sessionId, pendingRef);
    cmd.load(ctx);
  }, [armQueryTimeout, availableTriggers, beginQueryPerf, createGuardedLoadContext, startQuerySession]);

  /** 聚焦第 index 个窗口（1-based），用于工作流步骤 window N / focus N */
  const focusWindowByIndex = useCallback((index1Based: number) => {
    chrome.windows.getAll({ populate: false }).then((wins) => {
      const i = Math.min(index1Based, wins.length) - 1;
      if (i >= 0 && wins[i]?.id != null) {
        chrome.windows.update(wins[i].id!, { focused: true }).catch(() => {});
      }
    });
  }, []);

  /** 推进工作流到下一行；处理 wait / window 等无选择步骤后，再 setQuery 或结束。wait 由 background 定时，避免 popup 关闭后不执行 */
  const advanceWorkflow = useCallback(() => {
    const wf = workflowRunRef.current;
    if (!wf) return;
    while (wf.lineIndex < wf.lines.length) {
      const line = wf.lines[wf.lineIndex];
      const input = substituteVars(line.input, wf.vars, line.iteration);
      // 控制行：set / copy / note+ / if / end
      if (line.control === "set") {
        const kv = parseSetLine(input);
        if (kv) wf.vars[kv[0]] = kv[1];
        wf.lineIndex += 1;
        continue;
      }
      if (line.control === "copy") {
        const text = input.replace(/^copy\s+/i, "");
        navigator.clipboard.writeText(text).catch(() => {});
        chrome.storage.local.set({ lastCopiedText: text.slice(0, 20000) }).catch(() => {});
        wf.lineIndex += 1;
        continue;
      }
      if (line.control === "note") {
        const text = input.replace(/^note\+\s+/i, "");
        request({ action: "addNote", data: text }).catch(() => {});
        wf.lineIndex += 1;
        continue;
      }
      if (line.control === "if" && line.condition) {
        const condTrue = evaluateCondition(line.condition, wf.vars, line.iteration);
        if (!condTrue && typeof line.ifSkipTo === "number" && line.ifSkipTo >= 0) {
          wf.lineIndex = line.ifSkipTo + 1;
        } else {
          wf.lineIndex += 1;
        }
        continue;
      }
      if (line.control === "end") {
        wf.lineIndex += 1;
        continue;
      }
      if (isWaitStep(input)) {
        const ms = Math.min(parseWaitMs(input), 60_000);
        wf.lineIndex += 1;
        request({
          action: "scheduleWorkflowAdvance",
          data: { delayMs: ms, lines: wf.lines, lineIndex: wf.lineIndex, vars: wf.vars },
        }).catch(() => {});
        return;
      }
      if (isFocusWindowStep(input)) {
        focusWindowByIndex(parseFocusWindowIndex(input));
        wf.lineIndex += 1;
        continue;
      }
      break;
    }
    if (wf.lineIndex >= wf.lines.length) {
      workflowRunRef.current = null;
      executedLineRef.current = -1;
      notifyClose();
      return;
    }
    wf.inputForCurrentLine = substituteVars(wf.lines[wf.lineIndex].input, wf.vars, wf.lines[wf.lineIndex].iteration);
    executedLineRef.current = -1;
    // 必须带空格，parseQuery 才识别为「命令+过滤」并加载数据；否则只显示命令列表，不会拉 his/bm 等结果
    const nextInput = wf.inputForCurrentLine.trim();
    const queryForLoad = nextInput.endsWith(" ") ? nextInput : nextInput + " ";
    setQuery(queryForLoad);
    setSubList([]);
    setItems([]);
  }, [notifyClose, focusWindowByIndex]);

  const advanceWorkflowRef = useRef(advanceWorkflow);
  advanceWorkflowRef.current = advanceWorkflow;

  useEffect(() => {
    const onMessage = (msg: {
      action?: string;
      state?: { lines: ParsedWorkflowLine[]; lineIndex: number; vars?: Record<string, string> };
    }) => {
      if (msg.action === "workflowFinished") {
        workflowRunRef.current = null;
        executedLineRef.current = -1;
        return;
      }
      if (msg.action !== "workflowAdvance" || !msg.state) return;
      const { lines, lineIndex, vars } = msg.state;
      if (!Array.isArray(lines) || typeof lineIndex !== "number" || lineIndex < 0 || lineIndex >= lines.length) return;
      workflowRunRef.current = {
        lines,
        lineIndex,
        inputForCurrentLine: lines[lineIndex]?.input ?? "",
        vars: vars ?? {},
      };
      executedLineRef.current = -1;
      advanceWorkflowRef.current?.();
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  const runWorkflow = useCallback((item: ResultItem) => {
    const content = item.workflowContent ?? "";
    const lines = parseWorkflow(content);
    if (lines.length === 0) return;
    // 启动时取最近复制的文本作为 {{clipboard}} 内置变量
    request<string>({ action: "getLastCopiedText" })
      .then((last) => {
        if (!workflowRunRef.current) {
          workflowRunRef.current = {
            lines,
            lineIndex: 0,
            inputForCurrentLine: "",
            vars: buildBuiltinVars(typeof last === "string" ? last : ""),
          };
          executedLineRef.current = -1;
          advanceWorkflowRef.current?.();
        }
      })
      .catch(() => {
        workflowRunRef.current = {
          lines,
          lineIndex: 0,
          inputForCurrentLine: "",
          vars: buildBuiltinVars(""),
        };
        executedLineRef.current = -1;
        advanceWorkflowRef.current?.();
      });
  }, []);

  const handleSelect = useCallback(
    (item: ResultItem, opts?: { fromWorkflow?: boolean; altKey?: boolean; shiftKey?: boolean }) => {
      const fromWorkflow = opts?.fromWorkflow === true;
      const altKey = opts?.altKey === true;
      const shiftKey = opts?.shiftKey === true;
    const doClose = () => {
      if (!fromWorkflow) notifyClose();
    };
      const actionStartedAt = performance.now();
      if (item.disabled) {
        logDiagnostic({
          level: "warn",
          area: "command",
          type: "command_unavailable",
          message: item.disabledReason || "Command is unavailable",
          metadata: { query: queryRef.current, itemId: item.id, title: item.title },
        });
        return;
      }
      if (item.customCommandId && item.customCommandQuery !== undefined) {
        request({
          action: "saveCustomCommandMemory",
          data: { commandId: item.customCommandId, query: item.customCommandQuery },
        }).catch(() => {});
      }
      if (item.workflowId) {
        recordUsage(`workflow:${item.workflowId}`);
        logDiagnostic({
          level: "info",
          area: "workflow",
          type: "workflow_selected",
          message: `Selected workflow ${item.workflowId}`,
          metadata: { query: queryRef.current, workflowId: item.workflowId, title: item.title },
        });
        if (item.workflowContent) {
          logCommandPerf("command_perf_workflow_start", actionStartedAt, {
            query: queryRef.current,
            workflowId: item.workflowId,
          });
          runWorkflow(item);
          return;
        }
        request<{ id: string; content?: string } | null>({ action: "getWorkflow", data: item.workflowId }).then((w) => {
          if (w?.content) {
            logCommandPerf("command_perf_workflow_load", actionStartedAt, {
              query: queryRef.current,
              workflowId: item.workflowId,
            });
            runWorkflow({ ...item, workflowContent: w.content });
          }
        });
        return;
      }
      // ⇧ 批量：从列表首项到当前选中项（含）中所有带 url 的项，依次在新标签打开，最后一项为当前标签
      if (shiftKey && item.url) {
        const list = itemsRef.current;
        const idx = selectedIndexRef.current;
        const toOpen = list.slice(0, idx + 1).filter((x): x is ResultItem & { url: string } => !!x.url);
        if (toOpen.length >= 1) {
          Promise.all(
            toOpen.map((x, i) =>
              chrome.tabs.create({ url: x.url, active: i === toOpen.length - 1 })
            )
          ).then(() => {
            logCommandPerf("command_perf_batch_open", actionStartedAt, {
              query: queryRef.current,
              count: toOpen.length,
            });
            doClose();
          }, doClose);
          return;
        }
      }
      const t: Command | undefined = effectiveTriggers.find((x) => x.id === item.id);
      if (t) {
        recordUsage(`command:${t.id}`, 2);
        logDiagnostic({
          level: "info",
          area: "command",
          type: "command_selected",
          message: `Selected command ${t.id}`,
          metadata: { query: queryRef.current, commandId: t.id, triggerKey: t.key },
        });
        if (t.execute) {
          t.execute({
            openOptionsPage: () => chrome.runtime.openOptionsPage(),
            close: notifyClose,
          });
          logCommandPerf("command_perf_execute", actionStartedAt, {
            query: queryRef.current,
            commandId: t.id,
          });
          return;
        }
        if (t.mode) {
          loadedModeRef.current = t.mode;
          setQuery(t.key + " ");
          setMode(t.mode);
          setSubList([]);
          setItems([]);
          loadForMode(t.mode);
          return;
        }
        // 主模式下选中仅带 getResultFromFilter 的命令（如 bk）：补全为 key + 空格，由 effect 进入该命令
        setQuery(t.key + " ");
        logCommandPerf("command_perf_command_expand", actionStartedAt, {
          query: queryRef.current,
          commandId: t.id,
        });
        return;
      }
      if (item.id.startsWith("nav-") && typeof item.navIndex === "number") {
        recordUsage(buildUsageKey(item));
        window.parent.postMessage({ action: "CLICK_NAV", index: item.navIndex }, "*");
        logCommandPerf("command_perf_nav", actionStartedAt, {
          query: queryRef.current,
          itemId: item.id,
        });
        doClose();
        return;
      }
      if (item.id.startsWith("outline-") && typeof item.outlineIndex === "number") {
        recordUsage(buildUsageKey(item));
        window.parent.postMessage({ action: "SCROLL_TO_OUTLINE", index: item.outlineIndex }, "*");
        logCommandPerf("command_perf_outline", actionStartedAt, {
          query: queryRef.current,
          itemId: item.id,
        });
        doClose();
        return;
      }
      if (item.copyValue) {
        recordUsage(buildUsageKey(item));
        logDiagnostic({
          level: "info",
          area: "command",
          type: "copy_value",
          message: "Copied result to clipboard",
          metadata: { query: queryRef.current, itemId: item.id, title: item.title },
        });
        copyToClipboard(item.copyValue);
        logCommandPerf("command_perf_copy", actionStartedAt, {
          query: queryRef.current,
          itemId: item.id,
        });
        doClose();
        return;
      }
      if (item.runAction) {
        recordUsage(buildUsageKey(item));
        logDiagnostic({
          level: "info",
          area: "command",
          type: "run_action",
          message: `Executed action ${item.runAction}`,
          metadata: { query: queryRef.current, itemId: item.id, title: item.title },
        });
        request({ action: item.runAction, data: item.runPayload })
          .then(() => {
            logCommandPerf("command_perf_run_action", actionStartedAt, {
              query: queryRef.current,
              itemId: item.id,
              runAction: item.runAction,
            });
            doClose();
          })
          .catch(() => doClose());
        return;
      }
      if (item.url) {
        recordUsage(buildUsageKey(item));
        logDiagnostic({
          level: "info",
          area: "command",
          type: altKey ? "open_url_current_tab" : "open_url_new_tab",
          message: altKey ? "Opened URL in current tab" : "Opened URL in new tab",
          metadata: { query: queryRef.current, itemId: item.id, title: item.title, url: item.url },
        });
        if (altKey) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) chrome.tabs.update(tabs[0].id, { url: item.url });
            logCommandPerf("command_perf_open_url_current_tab", actionStartedAt, {
              query: queryRef.current,
              itemId: item.id,
            });
            doClose();
          });
        } else {
          chrome.tabs.create({ url: item.url });
          logCommandPerf("command_perf_open_url_new_tab", actionStartedAt, {
            query: queryRef.current,
            itemId: item.id,
          });
          doClose();
        }
      }
    },
    [notifyClose, copyToClipboard, loadForMode, effectiveTriggers, runWorkflow, logDiagnostic, recordUsage, logCommandPerf]
  );

  const saveLastQueryOnClose = useCallback(() => {
    if (mode !== "main" || !query.trim()) return;
    request<{ config?: { general?: { cacheLastCmd?: boolean } } }>({ action: "getData" }).then((data) => {
      if (data?.config?.general?.cacheLastCmd) {
        request({ action: "saveLastQuery", data: query }).catch(() => {});
      }
    });
  }, [query, mode]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) saveLastQueryOnClose();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [saveLastQueryOnClose]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // 深链：内容脚本带入查询词
      if (e.data?.action === "SET_QUERY" && typeof e.data.query === "string") {
        setQuery(e.data.query.slice(0, 300));
        return;
      }
      if (e.data?.action === "META" && Array.isArray(e.data.meta)) {
        const expected = pageResponseSessionRef.current;
        if (!expected || expected.kind !== "META" || !isQuerySessionActive(expected.sessionId)) return;
        pageResponseSessionRef.current = null;
        clearQueryTimeout();
        const next = metaToResultItems(e.data.meta);
        setSubList(next);
        applyItemsWithState(next);
        setSelectedIndex(0);
        return;
      }
      if (e.data?.action === "NAVS" && Array.isArray(e.data.navs)) {
        const expected = pageResponseSessionRef.current;
        if (!expected || expected.kind !== "NAVS" || !isQuerySessionActive(expected.sessionId)) return;
        pageResponseSessionRef.current = null;
        clearQueryTimeout();
        const next = e.data.navs.map((n: { name: string; path: string }, i: number) => ({
          id: `nav-${i}`,
          title: n.name.slice(0, 50),
          desc: n.path,
          navIndex: i,
        }));
        setSubList(next);
        applyItemsWithState(next);
        setSelectedIndex(0);
        return;
      }
      if (e.data?.action === "OUTLINE" && Array.isArray(e.data.outline)) {
        const expected = pageResponseSessionRef.current;
        if (!expected || expected.kind !== "OUTLINE" || !isQuerySessionActive(expected.sessionId)) return;
        pageResponseSessionRef.current = null;
        clearQueryTimeout();
        const next = e.data.outline.map((o: { name: string; index: number }) => ({
          id: `outline-${o.index}`,
          title: o.name,
          outlineIndex: o.index,
        }));
        setSubList(next);
        applyItemsWithState(next);
        setSelectedIndex(0);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [applyItemsWithState, clearQueryTimeout, isQuerySessionActive]);

  // Alfred-style: main = 按输入前缀匹配命令（如输入 b 则显示 bm、bks 等）；有 trigger+空格 再进入搜索/子模式
  useEffect(() => {
    if (!inSearchMode || !trigger) {
      clearQueryTimeout();
      pageResponseSessionRef.current = null;
      startQuerySession(`main:${query}`);
      loadedModeRef.current = null;
      loadedWorkflowsRef.current = false;
      loadedTriggerKeyRef.current = null;
      loadedFilterRef.current = null;
      lastGetResultFromFilterRef.current = null;
      setMode("main");
      setSubList([]);
      queryPerfRef.current = null;
      const q = query.trim().toLowerCase();
      // 主模式匹配：key 前缀优先（保持原有行为），再补充标题/拼音模糊匹配
      let commandItems: ResultItem[] = [];
      if (q) {
        const keyMatches = effectiveTriggers.filter((t) => t.key.toLowerCase().startsWith(q));
        const fuzzyMatches = fuzzyRank(
          effectiveTriggers.filter((t) => !keyMatches.includes(t)),
          q,
          (t) => `${t.key} ${t.title} ${i18nT(`cmd_${t.id}_title`)}`
        );
        commandItems = [...keyMatches, ...fuzzyMatches].map(commandToItem);
      } else {
        // 空态：最近使用分组 + 全部命令分组
        const all = sortItemsByUsage(availableTriggers.map(commandToItem), usageSnapshot);
        const recent = all.filter((it) => {
          const rec = usageSnapshot[`command:${it.id}`] ?? usageSnapshot[`item:${it.id}`];
          return !!rec && rec.score > 0;
        });
        commandItems = recent.length
          ? [
              ...recent.map((it) => ({ ...it, section: i18nT("cmdbox_section_recent") })),
              ...all
                .filter((it) => !recent.includes(it))
                .map((it) => ({ ...it, section: i18nT("cmdbox_section_all") })),
            ]
          : all;
      }
      const chromeItems = q
        ? filterChromePages(CHROME_PAGES, q, i18nT).map((p) => ({
            id: p.id,
            title: p.title,
            desc: p.desc,
            url: p.url,
          }))
        : [];
      const mainItems =
        commandItems.length || chromeItems.length
          ? [...sortItemsByUsage(commandItems, usageSnapshot), ...sortItemsByUsage(chromeItems, usageSnapshot)]
          : [createStateItem("empty", { title: i18nT("cmdbox_no_match"), code: "main_no_match" })];
      setQueryState(q ? getQueryStateFromItems(mainItems, "ready") : { status: "idle" });
      setItems(mainItems);
      setSelectedIndex((prev) => (prev < mainItems.length ? prev : 0));
      return;
    }
    if (trigger.action) return;
    if (trigger.getResultFromFilter) {
      const sessionKey = `grf:${triggerId ?? ""}:${searchKeyword ?? ""}:${filter}`;
      const cache = lastGetResultFromFilterRef.current;
      const sameCache =
        cache?.triggerId === triggerId &&
        cache?.filter === filter &&
        (triggerId !== "search" || cache?.searchKeyword === searchKeyword);
      if (sameCache) return;
      const sessionId = querySessionKeyRef.current === sessionKey ? querySessionRef.current : startQuerySession(sessionKey);
      beginQueryPerf(sessionId, { query: queryRef.current, triggerId: trigger.id, filter });
      armQueryTimeout(sessionId);
      lastGetResultFromFilterRef.current =
        triggerId === "search"
          ? { triggerId: triggerId!, filter, searchKeyword }
          : { triggerId: triggerId!, filter };
      const context =
        triggerId === "search"
          ? { searchKeyword, searchEngines: searchConfig?.searchEngines }
          : undefined;
      const run = () => {
        const p = Promise.resolve(trigger.getResultFromFilter!(filter, context));
        p.then((result) => {
          if (!isQuerySessionActive(sessionId)) return;
          clearQueryTimeout();
          const list = Array.isArray(result) ? result : [];
          logDiagnostic({
            level: "info",
            area: "query",
            type: "query_resolved",
            message: `Resolved ${list.length} result(s)`,
            metadata: { query: queryRef.current, triggerId: trigger.id, filter, count: list.length },
          });
          setSubList(list);
          applyItemsWithState(
            list.length ? list : [createStateItem("empty", { title: i18nT("cmdbox_no_result"), code: "query_no_result" })]
          );
          setSelectedIndex(0);
        }).catch(() => {
          if (!isQuerySessionActive(sessionId)) return;
          clearQueryTimeout();
          lastGetResultFromFilterRef.current = null;
          logDiagnostic({
            level: "error",
            area: "query",
            type: "query_failed",
            message: `Failed to resolve command ${trigger.id}`,
            metadata: { query: queryRef.current, triggerId: trigger.id, filter },
          });
          setSubList([]);
          applyItemsWithState([createStateItem("error", { title: i18nT("cmdbox_error"), code: "query_failed" })]);
          setSelectedIndex(0);
        });
      };
      run();
      return;
    }
    if (trigger.loadWorkflows && !workflowRunRef.current) {
      const needLoad = subList.length === 0 && !loadedWorkflowsRef.current;
      if (needLoad) {
        const sessionId = startQuerySession(`wf:${filter}`);
        beginQueryPerf(sessionId, { query: queryRef.current, triggerId: trigger.id, filter });
        armQueryTimeout(sessionId);
        loadedWorkflowsRef.current = true;
        const loadCtx = createGuardedLoadContext(sessionId, { current: false });
        trigger.loadWorkflows(loadCtx, filter);
        return;
      }
      if (subList.length === 0) return;
      const f = filter.trim().toLowerCase();
      const filtered =
        f.length > 0
          ? fuzzyRank(subList, f, (i) => `${i.title} ${i.desc ?? ""}`)
          : subList;
      const searchItems = filtered.length ? filtered : [createStateItem("empty", { title: i18nT("cmdbox_no_match"), code: "workflow_no_match" })];
      const same =
        itemsRef.current.length === searchItems.length &&
        itemsRef.current[0]?.id === searchItems[0]?.id;
      if (!same) {
        applyItemsWithState(searchItems);
        setSelectedIndex((prev) => (prev < searchItems.length ? prev : 0));
      }
      return;
    }
    if (trigger.mode) {
      loadedWorkflowsRef.current = false;
      setMode(trigger.mode);
    }
    const f = filter.trim().toLowerCase();
    const needLoadNoMode =
      !trigger.mode &&
      trigger.load &&
      (loadedTriggerKeyRef.current !== trigger.key ||
        (trigger.loadDependsOnFilter && loadedFilterRef.current !== filter));
    if (subList.length === 0 || needLoadNoMode) {
      if (subList.length === 0) {
        setItems([]);
        setQueryState({ status: "loading" });
      }
      if (trigger.mode && loadedModeRef.current !== trigger.mode) {
        loadedModeRef.current = trigger.mode;
        loadForMode(trigger.mode);
      } else if (!trigger.mode && trigger.load) {
        if (needLoadNoMode) {
          const sessionId = startQuerySession(
            `load:${trigger.id}:${trigger.loadDependsOnFilter ? filter : ""}`
          );
          beginQueryPerf(sessionId, { query: queryRef.current, triggerId: trigger.id, filter });
          armQueryTimeout(sessionId);
          loadedTriggerKeyRef.current = trigger.key;
          loadedFilterRef.current = filter;
          const loadCtx = createGuardedLoadContext(sessionId, { current: false });
          trigger.load(loadCtx, filter);
        }
      }
      return;
    }
    const filtered =
      f.length > 0
        ? fuzzyRank(subList, f, (i) => `${i.title} ${i.desc ?? ""}`)
        : subList;
    const searchItems = filtered.length ? filtered : [createStateItem("empty", { title: i18nT("cmdbox_no_match"), code: "sublist_no_match" })];
    const same =
      itemsRef.current.length === searchItems.length &&
      itemsRef.current[0]?.id === searchItems[0]?.id;
    if (!same) {
      applyItemsWithState(searchItems);
      setSelectedIndex((prev) => (prev < searchItems.length ? prev : 0));
    }
  }, [query, inSearchMode, triggerId, triggerKey, filter, subList, effectiveTriggers, availableTriggers, loadForMode, searchConfig?.searchEngines, searchKeyword, isQuerySessionActive, startQuerySession, createGuardedLoadContext, armQueryTimeout, commandToItem, clearQueryTimeout, logDiagnostic, applyItemsWithState, usageSnapshot, beginQueryPerf]);

  // 工作流逐步执行：当前行对应的数据加载完后，执行选中项并推进到下一行
  useEffect(() => {
    const wf = workflowRunRef.current;
    if (!wf || items.length === 0 || isStateItem(items[0]) || items[0]?.id?.startsWith("wf-")) return;
    if (query.trim() !== wf.inputForCurrentLine.trim()) return;
    if (executedLineRef.current === wf.lineIndex) return;
    // 非工作流时：等用户过滤完再执行；工作流中不等待，有结果即执行（如 openurl 单条、his 等）
    if (!wf && filter.trim() && subList.length > 0 && items.length === subList.length) {
      return;
    }
    const line = wf.lines[wf.lineIndex];
    let indices: number[];
    if (line.numbers === undefined) {
      indices = [0];
    } else if (line.numbers === -1) {
      indices = items.map((_, i) => i);
    } else if (Array.isArray(line.numbers)) {
      const from = fixNumber(line.numbers[0]);
      const to = fixNumber(line.numbers[1]);
      indices = [];
      for (let i = from; i <= to && i < items.length; i++) indices.push(i);
    } else {
      const i = fixNumber(line.numbers);
      indices = i < items.length ? [i] : [];
    }
    executedLineRef.current = wf.lineIndex;
    if (line.withShift && indices.length > 0) {
      handleSelect(items[indices[indices.length - 1]], { fromWorkflow: true, shiftKey: true });
    } else if (line.withAlt && indices.length > 0) {
      indices.forEach((i, idx) => {
        const isLast = idx === indices.length - 1;
        handleSelect(items[i], { fromWorkflow: true, altKey: isLast });
      });
    } else {
      indices.forEach((i) => handleSelect(items[i], { fromWorkflow: true }));
    }
    wf.lineIndex += 1;
    advanceWorkflow();
  }, [items, query, filter, subList, handleSelect, advanceWorkflow]);

  // 结果操作菜单：为当前选中项生成动作列表（打开/复制/无痕/新窗口等）
  const openActions = useCallback((item: ResultItem) => {
    const actions: ResultItem[] = [];
    const section = i18nT("item_action_section");
    if (item.url) {
      actions.push(
        { id: "act-open", section, title: i18nT("item_action_open"), desc: item.url, url: item.url },
        { id: "act-copy-url", section, title: i18nT("item_action_copy_url"), desc: item.url, copyValue: item.url },
        {
          id: "act-incognito",
          section,
          title: i18nT("item_action_incognito"),
          desc: item.url,
          runAction: "openIncognito",
          runPayload: item.url,
        },
        {
          id: "act-new-window",
          section,
          title: i18nT("item_action_new_window"),
          desc: item.url,
          runAction: "openNewWindow",
          runPayload: item.url,
        }
      );
      if (item.title && item.title !== item.url) {
        actions.push({ id: "act-copy-title", section, title: i18nT("item_action_copy_title"), desc: item.title, copyValue: item.title });
      }
    } else if (item.copyValue) {
      actions.push({
        id: "act-copy-content",
        section,
        title: i18nT("item_action_copy_content"),
        desc: item.copyValue.slice(0, 80),
        copyValue: item.copyValue,
      });
    } else if (item.runAction) {
      actions.push({
        id: "act-run-action",
        section,
        title: i18nT("item_action_run"),
        desc: item.desc ?? "",
        runAction: item.runAction,
        runPayload: item.runPayload,
      });
    }
    if (!actions.length) return;
    actions.push({ id: "act-back", title: i18nT("item_action_back") });
    setActionsFor({ parentItems: itemsRef.current, parentIndex: selectedIndexRef.current });
    setItems(actions);
    setSelectedIndex(0);
  }, []);

  const exitActions = useCallback(() => {
    setActionsFor((prev) => {
      if (prev) {
        setItems(prev.parentItems);
        setSelectedIndex(prev.parentIndex);
      }
      return null;
    });
  }, []);

  // Esc 对齐旧版：有输入时先清空（可配合 emptyCommand），输入已空时才关框
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        // 操作菜单中先返回列表
        if (actionsFor) {
          exitActions();
          return;
        }
        const q = queryRef.current.trim();
        if (q) {
          request<{ config?: { general?: { emptyCommand?: string } } }>({ action: "getData" }).then(
            (data) => {
              const emptyCmd = data?.config?.general?.emptyCommand?.trim();
              setQuery(emptyCmd || "");
            }
          );
          return;
        }
        saveLastQueryOnClose();
        notifyClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [saveLastQueryOnClose, notifyClose, actionsFor, exitActions]);

  // 用原生 keydown 捕获在容器上，确保空命令时箭头键也能生效（不依赖 React 合成事件）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      // ⌘/Ctrl + 1..9：直接选中第 N 项（Raycast 式快捷选择）
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key) - 1;
        const list = itemsRef.current;
        const item = list[idx];
        if (item && !isStateItem(item)) {
          e.preventDefault();
          e.stopPropagation();
          selectedIndexRef.current = idx;
          setSelectedIndex(idx);
          handleSelect(item, { altKey: e.altKey, shiftKey: e.shiftKey });
        }
        return;
      }
      const isDown = e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey);
      const isUp = e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey);
      // 结果操作菜单：→ 展开，← 返回
      if (e.key === "ArrowRight") {
        const list = itemsRef.current;
        const idx = selectedIndexRef.current;
        const item = list[idx];
        if (item && !isStateItem(item) && !actionsFor) {
          e.preventDefault();
          e.stopPropagation();
          openActions(item);
        }
        return;
      }
      if (e.key === "ArrowLeft" && actionsFor) {
        e.preventDefault();
        e.stopPropagation();
        exitActions();
        return;
      }
      if (isDown || isUp) {
        const list = itemsRef.current;
        const len = list.length;
        if (len === 0) return;
        e.preventDefault();
        e.stopPropagation();
        const curr = selectedIndexRef.current;
        const next = isDown ? (curr + 1) % len : (curr - 1 + len) % len;
        selectedIndexRef.current = next;
        setSelectedIndex(next);
        return;
      }
      if (e.key === "Enter") {
        const list = itemsRef.current;
        const idx = selectedIndexRef.current;
        const item = list[idx];
        if (item && !isStateItem(item))
          handleSelect(item, { altKey: e.altKey, shiftKey: e.shiftKey });
        e.preventDefault();
      }
    };
    el.addEventListener("keydown", onKey, true);
    return () => el.removeEventListener("keydown", onKey, true);
  }, [handleSelect, openActions, exitActions, actionsFor]);

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex, items]);

  const placeholder =
    mode === "main"
      ? i18nT("cmdbox_placeholder_main")
      : i18nT("cmdbox_placeholder_filter");

  return (
    <div
      ref={containerRef}
      className={`steward-box steward-glass flex flex-col ${inPage ? "min-h-full h-full" : "min-h-[400px]"}`}
      style={{
        borderRadius: `${radiusPx}px`,
        ...(boxBg ? { backgroundColor: boxBg } : {}),
      }}
      tabIndex={-1}
    >
      <div className="steward-search-row p-3 border-b flex items-center gap-2" style={{ minHeight: inputHeightPx }}>
        <svg
          className="steward-search-icon w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="steward-search-input input input-sm w-full"
          value={query}
          onChange={(e) => {
            // 输入时退出结果操作菜单
            if (actionsFor) setActionsFor(null);
            setQuery(e.target.value);
          }}
          autoFocus
        />
      </div>
      {queryState.status === "loading" && (
        <div className="p-4 text-center text-sm opacity-70">{i18nT("cmdbox_loading")}</div>
      )}
      <ul className="menu flex-1 overflow-auto min-h-[280px] p-2">
        {items.map((item, i) => {
          const showSection = !!item.section && (i === 0 || items[i - 1].section !== item.section);
          return (
            <Fragment key={item.id}>
              {showSection && (
                <li className="menu-title text-[11px] uppercase tracking-widest opacity-60 pointer-events-none px-2 pt-2 pb-1">
                  {item.section}
                </li>
              )}
              <li>
                <a
                  ref={i === selectedIndex ? selectedItemRef : null}
                  className={`${i === selectedIndex ? "active" : ""} ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  {item.icon ? (
                    <img
                      src={item.icon}
                      alt=""
                      className="w-4 h-4 rounded-sm shrink-0 mt-[3px] object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <span className="flex-1 min-w-0 flex flex-col">
                    <span className={`font-medium block max-w-full truncate ${getStateTone(item) ?? ""}`} style={{ fontSize: titleSizePx }}>{item.title}</span>
                    {item.desc && (
                      <span className="opacity-70 truncate block max-w-full" style={{ fontSize: subtitleSizePx }}>{item.desc}</span>
                    )}
                  </span>
                </a>
              </li>
            </Fragment>
          );
        })}
      </ul>
      <div className="steward-foot p-2 text-xs border-t flex items-center justify-between gap-2">
        <span className="truncate">
          {queryState.status !== "idle"
            ? `state: ${queryState.status}${queryState.code ? ` · ${queryState.code}` : ""}`
            : mode === "main"
            ? "trigger + space → search"
            : items.some((i) => i.url)
              ? "↑↓ Select · ⌘1-9 · → Actions · Enter Run · ⌥ Current tab · ⇧ Batch · Esc Close"
              : "↑↓ Select · ⌘1-9 · → Actions · Enter Run · Esc Close"}
        </span>
        {!inPage && (
          <button
            type="button"
            className="btn btn-ghost btn-xs shrink-0"
            onClick={openInPageBox}
            title={i18nT("open_in_page_hint")}
          >
            {i18nT("open_in_page")}
          </button>
        )}
      </div>
    </div>
  );
}

export { isInIframe };
