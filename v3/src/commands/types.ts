/**
 * 命令（插件）类型：每个命令一个目录，可含 index / background / content
 */

export type DataMode =
  | "pageMeta"
  | "pageNavs"
  | "pageOutline"
  | "history"
  | "bookmarks";

export type ActionType = "settings" | "close";

export interface ResultItem {
  id: string;
  title: string;
  desc?: string;
  icon?: string;
  copyValue?: string;
  url?: string;
  navIndex?: number;
  outlineIndex?: number;
  /** 工作流项：选中后执行该工作流 */
  workflowId?: string;
  workflowContent?: string;
  /** 由 background 执行的动作（tab 切换、扩展开关、下载操作等） */
  runAction?: string;
  runPayload?: unknown;
}

export interface LoadContext {
  setLoading: (v: boolean) => void;
  setMode: (mode: DataMode) => void;
  setSubList: (items: ResultItem[]) => void;
  setItems: (items: ResultItem[]) => void;
  setSelectedIndex: (n: number) => void;
  pendingRef: { current: boolean };
}

export interface ExecuteContext {
  openOptionsPage: () => void;
  close: () => void;
}

export interface Command {
  id: string;
  key: string;
  title: string;
  desc: string;
  mode?: DataMode;
  action?: ActionType;
  /** 有 mode 时由 loadForMode 调用；无 mode 时由 CmdBox 在 search 模式下调用，可带 filter */
  load?: (ctx: LoadContext, filter?: string) => void;
  /** 工作流等：按关键词过滤后拉取列表并 setItems，无 mode 时使用 */
  loadWorkflows?: (ctx: LoadContext, filter: string) => void;
  /** 按 filter 直接生成结果（计算器、openurl、自定义搜索等），无 mode 时使用；context 供搜索命令传引擎等 */
  getResultFromFilter?: (filter: string, context?: { searchKeyword?: string; searchEngines?: unknown[] }) => ResultItem[] | Promise<ResultItem[]>;
  /** 为 true 时 filter 变化会重新调用 load(ctx, filter)，用于 tabm 等需要把 filter 写入 runPayload 的命令 */
  loadDependsOnFilter?: boolean;
  execute?: (ctx: ExecuteContext) => void;
}
