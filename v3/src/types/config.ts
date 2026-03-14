/**
 * 与旧版 conf/general 兼容的配置结构（精简）
 */
export interface GeneralConfig {
  speedFirst?: boolean;
  cacheLastCmd?: boolean;
}

/** 插件级配置：commandId -> { disabled }，不写或 false 表示启用 */
export interface PluginsConfig {
  [commandId: string]: { disabled?: boolean };
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

export const DEFAULT_CONFIG: AppConfig = {
  general: DEFAULT_GENERAL,
  plugins: {},
  search: DEFAULT_SEARCH,
  appearance: DEFAULT_APPEARANCE,
};
