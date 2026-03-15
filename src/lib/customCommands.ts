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
  UrlResponseMap,
  BuiltinSourceKind,
  BuiltinSourceParams,
} from "@/types/config";

/** 按点号路径取对象属性，如 "data.items" => obj?.data?.items */
function getAtPath(obj: unknown, path: string): unknown {
  if (!path.trim()) return obj;
  return path.split(".").reduce((acc: unknown, key) => (acc != null && typeof acc === "object" && key in acc ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

function applyPlaceholders(tpl: string, ctx: { query?: string; title?: string; desc?: string; url?: string }): string {
  return tpl
    .replace(/\{query\}/g, ctx.query ?? "")
    .replace(/\{title\}/g, ctx.title ?? "")
    .replace(/\{desc\}/g, ctx.desc ?? "")
    .replace(/\{url\}/g, ctx.url ?? "");
}

function itemToResultItem(
  raw: CustomCommandItem,
  index: number,
  filter: string,
  action: CustomCommandAction,
  commandId: string
): ResultItem {
  const title = raw.title ?? "";
  const desc = raw.desc ?? "";
  const url = raw.url ?? "";
  const ctx = { query: filter, title, desc, url };

  const item: ResultItem = {
    id: `custom-${commandId}-${index}`,
    title,
    desc: desc || undefined,
  };

  switch (action.type) {
    case "openUrl":
      if (action.urlTemplate) {
        item.url = applyPlaceholders(action.urlTemplate, ctx);
      } else {
        if (url) item.url = url;
      }
      break;
    case "copy":
      item.copyValue = action.template ? applyPlaceholders(action.template, ctx) : title;
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

/** 用条目对象插值模板，{字段名} 替换为 obj[字段名]，支持中文等任意键名 */
function applyItemTemplate(tpl: string, obj: Record<string, unknown>): string {
  return tpl.replace(/\{([^}]+)\}/g, (_, key) => {
    const v = obj[key.trim()];
    return v != null ? String(v) : "";
  });
}

function mapRawToItem(raw: unknown, map: Required<UrlResponseMap>): CustomCommandItem | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = applyItemTemplate(map.titleTemplate, o).trim();
  if (!title) return null;
  const desc = applyItemTemplate(map.descTemplate, o).trim() || undefined;
  const url = applyItemTemplate(map.urlTemplate, o).trim() || undefined;
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
  filter: string
): Promise<CustomCommandItem[]> {
  if (source.type === "static") {
    const q = filter.trim().toLowerCase();
    if (!q) return source.items;
    return source.items.filter(
      (i) =>
        (i.title ?? "").toLowerCase().includes(q) ||
        (i.desc ?? "").toLowerCase().includes(q)
    );
  }
  if (source.type === "builtin") {
    return fetchBuiltinItems(source.builtin, source.params, filter);
  }
  const url = source.urlTemplate.replace(/\{query\}/g, encodeURIComponent(filter));
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const map: Required<UrlResponseMap> = { ...DEFAULT_RESPONSE_MAP, ...source.responseMap };
  const arr = map.arrayPath ? getAtPath(data, map.arrayPath) : data;
  if (!Array.isArray(arr)) return [];
  const items: CustomCommandItem[] = [];
  for (const raw of arr) {
    const item = mapRawToItem(raw, map);
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
      const rawItems = await getItemsFromSource(c.source, filter);
      return rawItems.map((raw, i) => itemToResultItem(raw, i, filter, c.action, c.id));
    },
  };
}

export function customCommandsToCommands(list: CustomCommand[]): Command[] {
  return list.map(customCommandToCommand);
}
