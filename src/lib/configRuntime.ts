import {
  CURRENT_CONFIG_SCHEMA_VERSION,
  DEFAULT_APPEARANCE,
  DEFAULT_CONFIG,
  DEFAULT_CUSTOM_COMMANDS,
  DEFAULT_GENERAL,
  DEFAULT_SEARCH,
  type AppConfig,
  type BuiltinSourceKind,
  type BuiltinSourceParams,
  type CustomCommand,
  type CustomCommandAction,
  type CustomCommandsConfig,
  type CustomCommandItem,
  type CustomCommandResultTemplate,
  type CustomCommandSource,
  type CustomCommandVariable,
  type SearchConfig,
  type SearchEngine,
  type UrlResponseMap,
} from "@/types/config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeSearchConfig(raw: unknown): SearchConfig {
  if (!isRecord(raw)) {
    return {
      searchEngines: [...DEFAULT_SEARCH.searchEngines],
      defaultSearchKeyword: DEFAULT_SEARCH.defaultSearchKeyword,
    };
  }

  const engines = Array.isArray(raw.searchEngines)
    ? raw.searchEngines.filter(isRecord).map((item, index): SearchEngine => ({
        id: typeof item.id === "string" && item.id.trim() ? item.id : `engine-${index}`,
        keyword: typeof item.keyword === "string" ? item.keyword : "",
        name: typeof item.name === "string" ? item.name : "",
        urlTemplate: typeof item.urlTemplate === "string" && item.urlTemplate.trim()
          ? item.urlTemplate
          : "https://www.google.com/search?q={query}",
      }))
    : [...DEFAULT_SEARCH.searchEngines];

  const defaultKeyword =
    typeof raw.defaultSearchKeyword === "string" ? raw.defaultSearchKeyword : DEFAULT_SEARCH.defaultSearchKeyword;

  return {
    searchEngines: engines.length ? engines : [...DEFAULT_SEARCH.searchEngines],
    defaultSearchKeyword:
      defaultKeyword && engines.some((engine) => engine.keyword === defaultKeyword)
        ? defaultKeyword
        : engines[0]?.keyword ?? DEFAULT_SEARCH.defaultSearchKeyword,
  };
}

function normalizeCustomCommands(raw: unknown): CustomCommandsConfig {
  if (!isRecord(raw) || !Array.isArray(raw.list)) {
    return { list: [...DEFAULT_CUSTOM_COMMANDS.list] };
  }
  return {
    list: raw.list.filter(isRecord).map((item, index) => normalizeCustomCommand(item, index)),
  };
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function normalizeCustomCommandItems(raw: unknown): CustomCommandItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isRecord).map((item) => ({
    id: normalizeString(item.id),
    title: typeof item.title === "string" ? item.title : "",
    desc: normalizeString(item.desc),
    url: normalizeString(item.url),
  }));
}

function normalizeUrlResponseMap(raw: unknown): UrlResponseMap | undefined {
  if (!isRecord(raw)) return undefined;
  const next: UrlResponseMap = {};
  if (typeof raw.arrayPath === "string") next.arrayPath = raw.arrayPath;
  if (typeof raw.titleTemplate === "string") next.titleTemplate = raw.titleTemplate;
  if (typeof raw.descTemplate === "string") next.descTemplate = raw.descTemplate;
  if (typeof raw.urlTemplate === "string") next.urlTemplate = raw.urlTemplate;
  return Object.keys(next).length ? next : undefined;
}

function normalizeBuiltinParams(raw: unknown): BuiltinSourceParams | undefined {
  if (!isRecord(raw)) return undefined;
  const next: BuiltinSourceParams = {};
  if (typeof raw.folderId === "string") next.folderId = raw.folderId;
  if (typeof raw.limit === "number" && Number.isFinite(raw.limit)) next.limit = raw.limit;
  if (typeof raw.enabled === "boolean") next.enabled = raw.enabled;
  return Object.keys(next).length ? next : undefined;
}

function isBuiltinSourceKind(value: unknown): value is BuiltinSourceKind {
  return (
    value === "tabs" ||
    value === "history" ||
    value === "bookmarks_recent" ||
    value === "bookmarks_folder" ||
    value === "topSites" ||
    value === "downloads" ||
    value === "extensions"
  );
}

function normalizeCustomCommandSource(raw: unknown): CustomCommandSource {
  if (!isRecord(raw)) return { type: "static", items: [] };
  if (raw.type === "url") {
    return {
      type: "url",
      urlTemplate:
        typeof raw.urlTemplate === "string" && raw.urlTemplate.trim()
          ? raw.urlTemplate
          : "https://api.example.com?q={query}",
      responseMap: normalizeUrlResponseMap(raw.responseMap),
    };
  }
  if (raw.type === "builtin") {
    return {
      type: "builtin",
      builtin: isBuiltinSourceKind(raw.builtin) ? raw.builtin : "tabs",
      params: normalizeBuiltinParams(raw.params),
    };
  }
  return {
    type: "static",
    items: normalizeCustomCommandItems(raw.items),
  };
}

function normalizeCustomCommandAction(raw: unknown): CustomCommandAction {
  if (!isRecord(raw)) return { type: "openUrl" };
  if (raw.type === "copy") {
    return { type: "copy", template: normalizeString(raw.template) };
  }
  if (raw.type === "workflow") {
    return { type: "workflow", workflowId: typeof raw.workflowId === "string" ? raw.workflowId : "" };
  }
  return {
    type: "openUrl",
    urlTemplate: normalizeString(raw.urlTemplate),
  };
}

function normalizeCustomCommandVariables(raw: unknown): CustomCommandVariable[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const next = raw
    .filter(isRecord)
    .map((item) => ({
      key: typeof item.key === "string" ? item.key : "",
      value: typeof item.value === "string" ? item.value : "",
    }))
    .filter((item) => item.key.trim());
  return next.length ? next : undefined;
}

function normalizeCustomCommandResultTemplate(raw: unknown): CustomCommandResultTemplate | undefined {
  if (!isRecord(raw)) return undefined;
  const next: CustomCommandResultTemplate = {};
  if (typeof raw.titleTemplate === "string") next.titleTemplate = raw.titleTemplate;
  if (typeof raw.descTemplate === "string") next.descTemplate = raw.descTemplate;
  if (typeof raw.urlTemplate === "string") next.urlTemplate = raw.urlTemplate;
  return Object.keys(next).length ? next : undefined;
}

function normalizeCustomCommand(raw: Record<string, unknown>, index: number): CustomCommand {
  return {
    id:
      typeof raw.id === "string" && raw.id.trim()
        ? raw.id
        : `cc-${Date.now()}-${index}`,
    key: typeof raw.key === "string" ? raw.key : "",
    title: typeof raw.title === "string" ? raw.title : "",
    desc: normalizeString(raw.desc),
    icon: normalizeString(raw.icon),
    variables: normalizeCustomCommandVariables(raw.variables),
    rememberLastQuery: raw.rememberLastQuery === true,
    resultTemplate: normalizeCustomCommandResultTemplate(raw.resultTemplate),
    source: normalizeCustomCommandSource(raw.source),
    action: normalizeCustomCommandAction(raw.action),
  };
}

export function normalizeAppConfig(raw: Partial<AppConfig> | null | undefined): AppConfig {
  const loaded = isRecord(raw) ? raw : {};
  const schemaVersion =
    typeof loaded.schemaVersion === "number" && Number.isFinite(loaded.schemaVersion)
      ? loaded.schemaVersion
      : 0;

  return {
    schemaVersion: Math.max(schemaVersion, CURRENT_CONFIG_SCHEMA_VERSION),
    general: {
      ...DEFAULT_GENERAL,
      ...(isRecord(loaded.general) ? loaded.general : {}),
    },
    plugins: {
      ...(DEFAULT_CONFIG.plugins ?? {}),
      ...(isRecord(loaded.plugins) ? loaded.plugins : {}),
    },
    search: normalizeSearchConfig(loaded.search),
    appearance: {
      ...DEFAULT_APPEARANCE,
      ...(isRecord(loaded.appearance) ? loaded.appearance : {}),
    },
    customCommands: normalizeCustomCommands(loaded.customCommands),
  };
}

export function isConfigMigrationNeeded(raw: Partial<AppConfig> | null | undefined): boolean {
  if (!isRecord(raw)) return true;
  return raw.schemaVersion !== CURRENT_CONFIG_SCHEMA_VERSION;
}
