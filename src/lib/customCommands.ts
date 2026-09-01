/**
 * 方案 A：将配置型自定义命令转为可纳入命令列表的 Command 形态
 * 借鉴 Alfred：触发词 → 数据源（静态/URL/内置）→ 选中后动作（打开 URL/复制/工作流）
 * 仅解析 JSON 或调用扩展 API，不执行任何用户代码。
 */
import type { Command, ResultItem } from "@/commands/types";
import { request } from "@/lib/portBridge";
import type {
  CustomCommand,
  CustomCommandItem,
  CustomCommandSource,
  CustomCommandAction,
  CustomCommandResultTemplate,
  UrlResponseMap,
  BuiltinSourceKind,
  BuiltinSourceParams,
  CustomCommandVariable,
} from "@/types/config";

/** 按点号路径取对象属性，如 "data.items" => obj?.data?.items */
function getAtPath(obj: unknown, path: string): unknown {
  if (!path.trim()) return obj;
  return path.split(".").reduce((acc: unknown, key) => (acc != null && typeof acc === "object" && key in acc ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

type TemplateContext = {
  query?: string;
  lastQuery?: string;
  title?: string;
  desc?: string;
  url?: string;
  values?: Record<string, unknown>;
  variables?: Record<string, string>;
};

function variablesToRecord(list: CustomCommandVariable[] | undefined): Record<string, string> {
  if (!Array.isArray(list)) return {};
  return Object.fromEntries(
    list
      .filter((item) => item.key.trim())
      .map((item) => [item.key.trim(), item.value ?? ""])
  );
}

function applyTemplate(tpl: string, ctx: TemplateContext, opts?: { encodeQuery?: boolean }): string {
  return tpl.replace(/\{([^}]+)\}/g, (_, rawKey) => {
    const key = String(rawKey ?? "").trim();
    if (!key) return "";
    if (key.startsWith("var:")) {
      const variableKey = key.slice(4).trim();
      return ctx.variables?.[variableKey] ?? "";
    }
    if (key === "query") {
      const value = ctx.query ?? "";
      return opts?.encodeQuery ? encodeURIComponent(value) : value;
    }
    if (key === "lastQuery") {
      const value = ctx.lastQuery ?? "";
      return opts?.encodeQuery ? encodeURIComponent(value) : value;
    }
    if (key === "title") return ctx.title ?? "";
    if (key === "desc") return ctx.desc ?? "";
    if (key === "url") return ctx.url ?? "";
    const value = ctx.values?.[key];
    return value == null ? "" : String(value);
  });
}

function renderSourceItem(raw: CustomCommandItem, ctx: TemplateContext): CustomCommandItem {
  return {
    id: raw.id,
    title: applyTemplate(raw.title ?? "", ctx),
    desc: raw.desc ? applyTemplate(raw.desc, ctx) : undefined,
    url: raw.url ? applyTemplate(raw.url, ctx) : undefined,
  };
}

function applyResultTemplate(
  raw: CustomCommandItem,
  resultTemplate: CustomCommandResultTemplate | undefined,
  ctx: TemplateContext
): CustomCommandItem {
  const rendered = renderSourceItem(raw, ctx);
  if (!resultTemplate) return rendered;
  const nextCtx = {
    ...ctx,
    title: rendered.title,
    desc: rendered.desc,
    url: rendered.url,
  };
  return {
    ...rendered,
    title: resultTemplate.titleTemplate ? applyTemplate(resultTemplate.titleTemplate, nextCtx) : rendered.title,
    desc: resultTemplate.descTemplate ? applyTemplate(resultTemplate.descTemplate, nextCtx) : rendered.desc,
    url: resultTemplate.urlTemplate ? applyTemplate(resultTemplate.urlTemplate, nextCtx) : rendered.url,
  };
}

function itemToResultItem(
  raw: CustomCommandItem,
  index: number,
  ctx: TemplateContext,
  action: CustomCommandAction,
  commandId: string,
  resultTemplate: CustomCommandResultTemplate | undefined,
  rememberLastQuery: boolean
): ResultItem {
  const rendered = applyResultTemplate(raw, resultTemplate, ctx);
  const title = rendered.title ?? "";
  const desc = rendered.desc ?? "";
  const url = rendered.url ?? "";
  const nextCtx = { ...ctx, title, desc, url };

  const item: ResultItem = {
    id: `custom-${commandId}-${index}`,
    title,
    desc: desc || undefined,
  };

  if (rememberLastQuery && (nextCtx.query ?? "").trim()) {
    item.customCommandId = commandId;
    item.customCommandQuery = nextCtx.query ?? "";
  }

  switch (action.type) {
    case "openUrl":
      if (action.urlTemplate) {
        item.url = applyTemplate(action.urlTemplate, nextCtx);
      } else {
        if (url) item.url = url;
      }
      break;
    case "copy":
      item.copyValue = action.template ? applyTemplate(action.template, nextCtx) : title;
      break;
    case "workflow":
      item.workflowId = action.workflowId;
      break;
  }
  return item;
}

const DEFAULT_RESPONSE_MAP: Required<UrlResponseMap> = {
  arrayPath: "",
  titleTemplate: "{title}",
  descTemplate: "{desc}",
  urlTemplate: "{url}",
};

function mapRawToItem(raw: unknown, map: Required<UrlResponseMap>, ctx: TemplateContext): CustomCommandItem | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const templateCtx = { ...ctx, values: o };
  const title = applyTemplate(map.titleTemplate, templateCtx).trim();
  if (!title) return null;
  const desc = applyTemplate(map.descTemplate, templateCtx).trim() || undefined;
  const url = applyTemplate(map.urlTemplate, templateCtx).trim() || undefined;
  return { title, desc, url };
}

function filterItemsByQuery(items: CustomCommandItem[], q: string): CustomCommandItem[] {
  if (!q) return items;
  const lower = q.toLowerCase();
  return items.filter(
    (i) =>
      (i.title ?? "").toLowerCase().includes(lower) ||
      (i.desc ?? "").toLowerCase().includes(lower) ||
      (i.url ?? "").toLowerCase().includes(lower)
  );
}

async function fetchBuiltinItems(
  builtin: BuiltinSourceKind,
  params: BuiltinSourceParams | undefined,
  filter: string
): Promise<CustomCommandItem[]> {
  const p = params ?? {};
  try {
    switch (builtin) {
      case "tabs": {
        const tabs = await request<{ id: number; title: string; url: string }[]>({
          action: "getTabs",
          data: { query: filter },
        });
        const list = Array.isArray(tabs) ? tabs : [];
        return list.map((t) => ({
          title: t.title || t.url || "",
          desc: t.url,
          url: t.url,
        }));
      }
      case "history": {
        const list = await request<{ id: string; title: string; url: string }[]>({ action: "getHistory" });
        const arr = Array.isArray(list) ? list : [];
        return filterItemsByQuery(
          arr.map((h) => ({ title: h.title || h.url || "", url: h.url })),
          filter
        );
      }
      case "bookmarks_recent": {
        const list = await request<{ id: string; title: string; url: string }[]>({ action: "getBookmarks" });
        const arr = Array.isArray(list) ? list : [];
        return filterItemsByQuery(
          arr.map((b) => ({ title: b.title || b.url || "", url: b.url })),
          filter
        );
      }
      case "bookmarks_folder": {
        const folderId = p.folderId ?? "1";
        const list = await request<{ id: string; title: string; url: string }[]>({
          action: "getBookmarkFolder",
          data: folderId,
        });
        const arr = Array.isArray(list) ? list : [];
        return filterItemsByQuery(
          arr.map((b) => ({ title: b.title || b.url || "", url: b.url })),
          filter
        );
      }
      case "topSites": {
        const list = await request<{ title?: string; url: string }[]>({ action: "getTopSites" });
        const arr = Array.isArray(list) ? list : [];
        return filterItemsByQuery(
          arr.map((s) => ({ title: (s.title || s.url || "").trim() || s.url, url: s.url })),
          filter
        );
      }
      case "downloads": {
        const list = await request<{ id: number; url: string; filename: string; state?: string }[]>({
          action: "getDownloads",
          data: { query: [] },
        });
        const arr = Array.isArray(list) ? list : [];
        const limit = p.limit ?? 30;
        return filterItemsByQuery(
          arr.slice(0, limit).map((d) => ({
            title: d.filename || d.url || "",
            desc: d.state,
            url: d.url,
          })),
          filter
        );
      }
      case "extensions": {
        const list = await request<{ id: string; name: string; description?: string; optionsUrl?: string; homepageUrl?: string }[]>({
          action: "getExtensions",
          data: { enabled: p.enabled, query: filter },
        });
        const arr = Array.isArray(list) ? list : [];
        return arr.map((e) => ({
          title: e.name || e.id,
          desc: e.description,
          url: e.optionsUrl || e.homepageUrl || "",
        }));
      }
      default:
        return [];
    }
  } catch {
    return [];
  }
}

async function getItemsFromSource(
  source: CustomCommandSource,
  ctx: TemplateContext
): Promise<CustomCommandItem[]> {
  const filter = ctx.query ?? "";
  if (source.type === "static") {
    const renderedItems = source.items.map((item) => renderSourceItem(item, ctx));
    const q = filter.trim().toLowerCase();
    if (!q) return renderedItems;
    return renderedItems.filter(
      (i) =>
        (i.title ?? "").toLowerCase().includes(q) ||
        (i.desc ?? "").toLowerCase().includes(q) ||
        (i.url ?? "").toLowerCase().includes(q)
    );
  }
  if (source.type === "builtin") {
    return fetchBuiltinItems(source.builtin, source.params, filter);
  }
  const url = applyTemplate(source.urlTemplate, ctx, { encodeQuery: true });
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const map: Required<UrlResponseMap> = { ...DEFAULT_RESPONSE_MAP, ...source.responseMap };
  const arr = map.arrayPath ? getAtPath(data, map.arrayPath) : data;
  if (!Array.isArray(arr)) return [];
  const items: CustomCommandItem[] = [];
  for (const raw of arr) {
    const item = mapRawToItem(raw, map, ctx);
    if (item) items.push(item);
  }
  return items;
}

export function customCommandToCommand(c: CustomCommand): Command {
  return {
    id: `custom-${c.id}`,
    key: c.key,
    title: c.title,
    desc: c.desc ?? "",
    getResultFromFilter: async (filter: string): Promise<ResultItem[]> => {
      const lastQuery = c.rememberLastQuery
        ? (await request<string>({ action: "getCustomCommandMemory", data: c.id })) ?? ""
        : "";
      const query = filter.trim() || !c.rememberLastQuery ? filter : lastQuery;
      const ctx: TemplateContext = {
        query,
        lastQuery,
        variables: variablesToRecord(c.variables),
      };
      const rawItems = await getItemsFromSource(c.source, ctx);
      return rawItems.map((raw, i) =>
        itemToResultItem(raw, i, ctx, c.action, c.id, c.resultTemplate, c.rememberLastQuery === true)
      );
    },
  };
}

export function customCommandsToCommands(list: CustomCommand[]): Command[] {
  return list.map(customCommandToCommand);
}
