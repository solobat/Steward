/**
 * 与旧版 conf/general 兼容的配置结构（精简）
 */
export interface GeneralConfig {
  speedFirst?: boolean;
  cacheLastCmd?: boolean;
}

/** 插件级配置：commandId -> { disabled?, triggerKey? }，triggerKey 为空则用命令默认 key */
export interface PluginsConfig {
  [commandId: string]: { disabled?: boolean; triggerKey?: string };
}

/** 自定义搜索引擎：关键词 + 名称 + URL 模板（{query} 会被替换） */
export interface SearchEngine {
  id: string;
  keyword: string;
  name: string;
  urlTemplate: string;
}

export interface SearchConfig {
  searchEngines: SearchEngine[];
  defaultSearchKeyword: string;
}

/** 方案 A：配置型自定义命令（Alfred 式触发词 + 数据源 + 动作），不执行用户代码 */
export interface CustomCommandItem {
  id?: string;
  title: string;
  desc?: string;
  url?: string;
}

/**
 * URL 数据源：API 返回结构不固定时，用「数组路径」+「模板字符串」从每条记录取标题/描述/链接
 * 模板中 {字段名} 会被替换为该条目的对应字段值，仅做安全读取（无用户代码）
 */
export interface UrlResponseMap {
  /** 取数组的路径，点号分隔，如 "data.items"；空表示根即数组 */
  arrayPath?: string;
  /** 标题模板，如 "{title}" 或 "{name} v{version}"，默认 "{title}" */
  titleTemplate?: string;
  /** 描述模板，如 "{desc}" 或 "{subtitle}"，默认 "{desc}" */
  descTemplate?: string;
  /** 链接模板，如 "{url}" 或 "{arg}"（Alfred），默认 "{url}" */
  urlTemplate?: string;
}

/** 结果来源：静态列表 或 URL 拉取 JSON（仅解析数据，不执行脚本） */
export type CustomCommandSource =
  | { type: "static"; items: CustomCommandItem[] }
  | { type: "url"; urlTemplate: string; responseMap?: UrlResponseMap };

/** 选中后的动作 */
export type CustomCommandAction =
  | { type: "openUrl"; urlTemplate?: string }
  | { type: "copy"; template?: string }
  | { type: "workflow"; workflowId: string };

export interface CustomCommand {
  id: string;
  key: string;
  title: string;
  desc?: string;
  icon?: string;
  source: CustomCommandSource;
  action: CustomCommandAction;
}

export interface CustomCommandsConfig {
  list: CustomCommand[];
}

/** 外观：命令框主题、字号、强调色、布局（参考旧版 / Alfred） */
export type AppearanceTheme = "light" | "dark" | "system";
export type AppearanceFontSize = "small" | "medium" | "large";
export type AppearanceDensity = "compact" | "default" | "relaxed";
export type AppearanceRadius = "sharp" | "default" | "round";
export type AppearanceSize = "small" | "medium" | "large";

export interface AppearanceConfig {
  theme?: AppearanceTheme;
  fontSize?: AppearanceFontSize;
  /** 强调色（按钮、选中态等），hex 如 #570df8，空则用主题默认 */
  primaryColor?: string;
  /** 列表行密度 */
  listDensity?: AppearanceDensity;
  /** 命令框圆角 */
  cornerRadius?: AppearanceRadius;
  /** 输入框高度（类似旧版 --search-input-height） */
  inputHeight?: AppearanceSize;
  /** 命令框背景色 hex，空则用主题 */
  boxBackground?: string;
  /** 列表标题字号 */
  titleSize?: AppearanceSize;
  /** 列表描述字号 */
  subtitleSize?: AppearanceSize;
}

export interface AppConfig {
  general: GeneralConfig;
  plugins?: PluginsConfig;
  search?: SearchConfig;
  appearance?: AppearanceConfig;
  customCommands?: CustomCommandsConfig;
}

export const DEFAULT_GENERAL: GeneralConfig = {
  speedFirst: false,
  cacheLastCmd: true,
};

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  { id: "g", keyword: "g", name: "Google", urlTemplate: "https://www.google.com/search?q={query}" },
  { id: "w", keyword: "w", name: "Wikipedia", urlTemplate: "https://zh.wikipedia.org/wiki/Special:Search?search={query}" },
  { id: "bd", keyword: "bd", name: "百度", urlTemplate: "https://www.baidu.com/s?wd={query}" },
];

export const DEFAULT_SEARCH: SearchConfig = {
  searchEngines: DEFAULT_SEARCH_ENGINES,
  defaultSearchKeyword: "g",
};

export const DEFAULT_APPEARANCE: AppearanceConfig = {
  theme: "system",
  fontSize: "medium",
  primaryColor: "",
  listDensity: "default",
  cornerRadius: "default",
  inputHeight: "medium",
  boxBackground: "",
  titleSize: "medium",
  subtitleSize: "medium",
};

export const DEFAULT_CUSTOM_COMMANDS: CustomCommandsConfig = { list: [] };

export const DEFAULT_CONFIG: AppConfig = {
  general: DEFAULT_GENERAL,
  plugins: {},
  search: DEFAULT_SEARCH,
  appearance: DEFAULT_APPEARANCE,
  customCommands: DEFAULT_CUSTOM_COMMANDS,
};
