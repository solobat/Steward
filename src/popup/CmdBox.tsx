import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { TRIGGERS, type Command, type DataMode, type ResultItem } from "../commands";
import { isCalculableExpression } from "../commands/calculate";
import { isUrlLike } from "../commands/openurl";
import { request } from "@/lib/portBridge";
import { customCommandsToCommands } from "@/lib/customCommands";
import { t as i18nT } from "@/lib/i18n";
import { DEFAULT_CONFIG, type AppearanceConfig, type CustomCommand, type SearchConfig } from "@/types/config";
import { parseWorkflow, fixNumber } from "@/lib/workflow";
import { CHROME_PAGES, filterChromePages } from "@/lib/chromePages";
import type { ParsedWorkflowLine } from "@/types/workflow";

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
  hasMainModeExtraMatches?: (trimmed: string) => boolean
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
    if (trimmed && triggers.some((t) => t.key.toLowerCase().startsWith(trimmed.toLowerCase())))
      return { inSearchMode: false, triggerKey: "", filter: "", trigger: null };
    const calcCmd = triggers.find((t) => t.id === "calculate");
    if (calcCmd && trimmed && isCalculableExpression(trimmed))
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

const RADIUS_CLASS: Record<string, string> = {
  sharp: "rounded-none",
  default: "rounded-lg",
  round: "rounded-2xl",
};

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

export default function CmdBox({ appearance }: { appearance?: AppearanceConfig }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const radiusClass = RADIUS_CLASS[appearance?.cornerRadius ?? "default"] ?? "rounded-lg";
  const boxBg =
    appearance?.boxBackground && /^#[0-9A-Fa-f]{6}$/.test(appearance.boxBackground)
      ? appearance.boxBackground
      : undefined;
  const inputHeightPx = appearanceSizeToPx(appearance?.inputHeight, "inputHeight");
  const titleSizePx = appearanceSizeToPx(appearance?.titleSize, "title");
  const subtitleSizePx = appearanceSizeToPx(appearance?.subtitleSize, "subtitle");
  const selectedItemRef = useRef<HTMLAnchorElement | null>(null);
  const inPage = isInIframe();
  const [effectiveTriggers, setEffectiveTriggers] = useState<Command[]>(TRIGGERS);
  const [query, setQuery] = useState("");
  const commandToItem = useCallback((cmd: Command): ResultItem => {
    const isCustom = cmd.id.startsWith("custom-");
    const title = isCustom ? `${cmd.key}  ${cmd.title}` : `${cmd.key}  ${i18nT(`cmd_${cmd.id}_title`) || cmd.title}`;
    const desc = isCustom ? (cmd.desc ?? "") : (i18nT(`cmd_${cmd.id}_desc`) || cmd.desc) ?? "";
    return { id: cmd.id, title, desc };
  }, []);
  const triggersForDisplay = useMemo(
    () => (inPage ? effectiveTriggers : effectiveTriggers.filter((t) => !t.pageOnly)),
    [effectiveTriggers, inPage]
  );
  const [items, setItems] = useState<ResultItem[]>(() =>
    (inPage ? TRIGGERS : TRIGGERS.filter((t) => !t.pageOnly)).map(commandToItem)
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [mode, setMode] = useState<"main" | DataMode>("main");
  const [subList, setSubList] = useState<ResultItem[]>([]);
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
  } | null>(null);
  const executedLineRef = useRef(-1);
  const loadedWorkflowsRef = useRef(false);
  const loadedTriggerKeyRef = useRef<string | null>(null);
  const loadedFilterRef = useRef<string | null>(null);
  const lastGetResultFromFilterRef = useRef<{ triggerId: string; filter: string; searchKeyword?: string } | null>(null);
  const triggerIdRef = useRef<string | null>(null);
  itemsRef.current = items;
  selectedIndexRef.current = selectedIndex;

  const hasMainModeExtraMatches = useCallback(
    (trimmed: string) => filterChromePages(CHROME_PAGES, trimmed, i18nT).length > 0,
    []
  );
  const { inSearchMode, filter, trigger, searchKeyword } = parseQuery(
    query,
    triggersForDisplay,
    searchConfig,
    hasMainModeExtraMatches
  );
  const triggerId = trigger?.id ?? null;
  const triggerKey = trigger?.key ?? null;
  triggerIdRef.current = triggerId;

  useEffect(() => {
    Promise.all([
      request<{ config?: { general?: { cacheLastCmd?: boolean }; plugins?: Record<string, { disabled?: boolean; triggerKey?: string }>; search?: SearchConfig; customCommands?: { list?: CustomCommand[] } } }>({ action: "getData" }),
      request<string>({ action: "getLastQuery" }),
    ])
      .then(([data, lastQuery]) => {
        const config = data?.config;
        if (config?.general?.cacheLastCmd && typeof lastQuery === "string" && lastQuery) {
          setQuery(lastQuery);
        }
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

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  const loadForMode = useCallback((dataMode: DataMode) => {
    const cmd = triggersForDisplay.find((t) => t.mode === dataMode);
    if (!cmd?.load) return;
    const pendingRef =
      dataMode === "history"
        ? historyPendingRef
        : dataMode === "bookmarks"
          ? bookmarksPendingRef
          : { current: false };
    const ctx = {
      setLoading: setLoadingMeta,
      setMode,
      setSubList,
      setItems,
      setSelectedIndex,
      pendingRef,
    };
    cmd.load(ctx);
  }, [triggersForDisplay]);

  const runWorkflow = useCallback((item: ResultItem) => {
    const content = item.workflowContent ?? "";
    const lines = parseWorkflow(content);
    if (lines.length === 0) return;
    workflowRunRef.current = {
      lines,
      lineIndex: 0,
      inputForCurrentLine: lines[0].input,
    };
    executedLineRef.current = -1;
    setQuery(lines[0].input);
    setSubList([]);
    setItems([]);
  }, []);

  const handleSelect = useCallback(
    (item: ResultItem, opts?: { fromWorkflow?: boolean; altKey?: boolean; shiftKey?: boolean }) => {
      const fromWorkflow = opts?.fromWorkflow === true;
      const altKey = opts?.altKey === true;
      const shiftKey = opts?.shiftKey === true;
      const doClose = () => {
        if (!fromWorkflow) notifyClose();
      };
      if (item.workflowId) {
        if (item.workflowContent) {
          runWorkflow(item);
          return;
        }
        request<{ id: string; content?: string } | null>({ action: "getWorkflow", data: item.workflowId }).then((w) => {
          if (w?.content) runWorkflow({ ...item, workflowContent: w.content });
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
          ).then(doClose, doClose);
          return;
        }
      }
      const t: Command | undefined = triggersForDisplay.find((x) => x.id === item.id);
      if (t) {
        if (t.execute) {
          t.execute({
            openOptionsPage: () => chrome.runtime.openOptionsPage(),
            close: notifyClose,
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
        return;
      }
      if (item.id.startsWith("nav-") && typeof item.navIndex === "number") {
        window.parent.postMessage({ action: "CLICK_NAV", index: item.navIndex }, "*");
        doClose();
        return;
      }
      if (item.id.startsWith("outline-") && typeof item.outlineIndex === "number") {
        window.parent.postMessage({ action: "SCROLL_TO_OUTLINE", index: item.outlineIndex }, "*");
        doClose();
        return;
      }
      if (item.copyValue) {
        copyToClipboard(item.copyValue);
        doClose();
        return;
      }
      if (item.runAction) {
        request({ action: item.runAction, data: item.runPayload })
          .then(() => doClose())
          .catch(() => doClose());
        return;
      }
      if (item.url) {
        if (altKey) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) chrome.tabs.update(tabs[0].id, { url: item.url });
            doClose();
          });
        } else {
          chrome.tabs.create({ url: item.url });
          doClose();
        }
      }
    },
    [notifyClose, copyToClipboard, loadForMode, triggersForDisplay, runWorkflow]
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
      if (e.data?.action === "META" && Array.isArray(e.data.meta)) {
        setLoadingMeta(false);
        const next = metaToResultItems(e.data.meta);
        setSubList(next);
        setItems(next);
        setSelectedIndex(0);
        return;
      }
      if (e.data?.action === "NAVS" && Array.isArray(e.data.navs)) {
        setLoadingMeta(false);
        const next = e.data.navs.map((n: { name: string; path: string }, i: number) => ({
          id: `nav-${i}`,
          title: n.name.slice(0, 50),
          desc: n.path,
          navIndex: i,
        }));
        setSubList(next);
        setItems(next);
        setSelectedIndex(0);
        return;
      }
      if (e.data?.action === "OUTLINE" && Array.isArray(e.data.outline)) {
        setLoadingMeta(false);
        const next = e.data.outline.map((o: { name: string; index: number }) => ({
          id: `outline-${o.index}`,
          title: o.name,
          outlineIndex: o.index,
        }));
        setSubList(next);
        setItems(next);
        setSelectedIndex(0);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Alfred-style: main = 按输入前缀匹配命令（如输入 b 则显示 bm、bks 等）；有 trigger+空格 再进入搜索/子模式
  useEffect(() => {
    if (!inSearchMode || !trigger) {
      loadedModeRef.current = null;
      loadedWorkflowsRef.current = false;
      loadedTriggerKeyRef.current = null;
      loadedFilterRef.current = null;
      lastGetResultFromFilterRef.current = null;
      setMode("main");
      setSubList([]);
      const q = query.trim().toLowerCase();
      // 有输入时：只显示 key 以输入为前缀的命令（如 b → bm/bks）；命令下列出后再追加匹配的 Chrome 内置页
      const filtered = q
        ? triggersForDisplay.filter((t) => t.key.toLowerCase().startsWith(q))
        : triggersForDisplay;
      const commandItems = filtered.length ? filtered.map(commandToItem) : [];
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
          ? [...commandItems, ...chromeItems]
          : [{ id: "none", title: i18nT("cmdbox_no_match"), desc: "" }];
      setItems(mainItems);
      setSelectedIndex((prev) => (prev < mainItems.length ? prev : 0));
      return;
    }
    if (trigger.action) return;
    if (trigger.getResultFromFilter) {
      const cache = lastGetResultFromFilterRef.current;
      const sameCache =
        cache?.triggerId === triggerId &&
        cache?.filter === filter &&
        (triggerId !== "search" || cache?.searchKeyword === searchKeyword);
      if (sameCache) return;
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
          const list = Array.isArray(result) ? result : [];
          setSubList(list);
          setItems(list.length ? list : [{ id: "none", title: i18nT("cmdbox_no_result"), desc: "" }]);
          setSelectedIndex(0);
        }).catch(() => {
          lastGetResultFromFilterRef.current = null;
          setSubList([]);
          setItems([{ id: "none", title: i18nT("cmdbox_error"), desc: "" }]);
          setSelectedIndex(0);
        });
      };
      run();
      return;
    }
    if (trigger.loadWorkflows && !workflowRunRef.current) {
      const needLoad = subList.length === 0 && !loadedWorkflowsRef.current;
      if (needLoad) {
        loadedWorkflowsRef.current = true;
        const loadCtx = {
          setLoading: setLoadingMeta,
          setMode,
          setSubList,
          setItems,
          setSelectedIndex,
          pendingRef: { current: false },
        };
        trigger.loadWorkflows(loadCtx, filter);
        return;
      }
      if (subList.length === 0) return;
      const f = filter.trim().toLowerCase();
      const filtered =
        f.length > 0
          ? subList.filter(
              (i) =>
                i.title.toLowerCase().includes(f) || (i.desc && i.desc.toLowerCase().includes(f))
            )
          : subList;
      const searchItems = filtered.length ? filtered : [{ id: "none", title: i18nT("cmdbox_no_match"), desc: "" }];
      const same =
        itemsRef.current.length === searchItems.length &&
        itemsRef.current[0]?.id === searchItems[0]?.id;
      if (!same) {
        setItems(searchItems);
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
      if (subList.length === 0) setItems([]);
      if (trigger.mode && loadedModeRef.current !== trigger.mode) {
        loadedModeRef.current = trigger.mode;
        loadForMode(trigger.mode);
      } else if (!trigger.mode && trigger.load) {
        if (needLoadNoMode) {
          loadedTriggerKeyRef.current = trigger.key;
          loadedFilterRef.current = filter;
          const loadCtx = {
            setLoading: setLoadingMeta,
            setMode,
            setSubList,
            setItems,
            setSelectedIndex,
            pendingRef: { current: false },
          };
          trigger.load(loadCtx, filter);
        }
      }
      return;
    }
    const filtered =
      f.length > 0
        ? subList.filter(
            (i) =>
              i.title.toLowerCase().includes(f) || (i.desc && i.desc.toLowerCase().includes(f))
          )
        : subList;
const searchItems = filtered.length ? filtered : [{ id: "none", title: i18nT("cmdbox_no_match"), desc: "" }];
      const same =
        itemsRef.current.length === searchItems.length &&
      itemsRef.current[0]?.id === searchItems[0]?.id;
    if (!same) {
      setItems(searchItems);
      setSelectedIndex((prev) => (prev < searchItems.length ? prev : 0));
    }
  }, [query, inSearchMode, triggerId, triggerKey, filter, subList, triggersForDisplay, loadForMode]);

  // 工作流逐步执行：当前行对应的数据加载完后，执行选中项并推进到下一行
  useEffect(() => {
    const wf = workflowRunRef.current;
    if (!wf || items.length === 0 || items[0]?.id === "none" || items[0]?.id?.startsWith("wf-")) return;
    if (query.trim() !== wf.inputForCurrentLine.trim()) return;
    if (executedLineRef.current === wf.lineIndex) return;
    if (filter.trim() && subList.length > 0 && items.length === subList.length) {
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
    if (wf.lineIndex < wf.lines.length) {
      const nextInput = wf.lines[wf.lineIndex].input;
      wf.inputForCurrentLine = nextInput;
      executedLineRef.current = -1;
      setQuery(nextInput);
      setSubList([]);
      setItems([]);
    } else {
      workflowRunRef.current = null;
      executedLineRef.current = -1;
      notifyClose();
    }
  }, [items, query, filter, subList, handleSelect, notifyClose]);

  // Esc 对齐旧版：有输入时先清空（可配合 emptyCommand），输入已空时才关框
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
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
  }, [saveLastQueryOnClose, notifyClose]);

  // 用原生 keydown 捕获在容器上，确保空命令时箭头键也能生效（不依赖 React 合成事件）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const isDown = e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey);
      const isUp = e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey);
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
        if (item && item.id !== "none")
          handleSelect(item, { altKey: e.altKey, shiftKey: e.shiftKey });
        e.preventDefault();
      }
    };
    el.addEventListener("keydown", onKey, true);
    return () => el.removeEventListener("keydown", onKey, true);
  }, [handleSelect]);

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
      className={`flex flex-col ${!boxBg ? "bg-base-200" : ""} shadow-xl ${radiusClass} ${isInIframe() ? "min-h-full h-full" : "min-h-[400px]"}`}
      style={boxBg ? { backgroundColor: boxBg } : undefined}
      tabIndex={-1}
    >
      <div className="p-3 border-b border-base-300 flex items-center" style={{ minHeight: inputHeightPx }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="input input-bordered input-sm w-full bg-base-100 font-mono"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      {loadingMeta && (
        <div className="p-4 text-center text-sm opacity-70">{i18nT("cmdbox_loading")}</div>
      )}
      <ul className="menu flex-1 overflow-auto min-h-[280px] p-2 bg-base-200/50">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              ref={i === selectedIndex ? selectedItemRef : null}
              className={i === selectedIndex ? "active" : ""}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="font-medium block max-w-full truncate" style={{ fontSize: titleSizePx }}>{item.title}</span>
              {item.desc && (
                <span className="opacity-70 truncate block max-w-full" style={{ fontSize: subtitleSizePx }}>{item.desc}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
      <div className="p-2 text-xs opacity-60 border-t border-base-300 font-mono">
        {mode === "main"
          ? "trigger + space → search"
          : items.some((i) => i.url)
            ? "↑↓ Select · Enter Run · ⌥ Current tab · ⇧ Batch · Esc Close"
            : "↑↓ Select · Enter Run · Esc Close"}
      </div>
    </div>
  );
}

export { isInIframe };
