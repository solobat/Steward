import type { Command, ResultItem } from "../types";
import type { SearchEngine } from "@/types/config";

function buildSearchResult(engine: SearchEngine, query: string): ResultItem[] {
  const url = engine.urlTemplate.replace(/\{query\}/g, encodeURIComponent(query));
  return [
    {
      id: "search-1",
      title: `${engine.name}: ${query.slice(0, 40)}${query.length > 40 ? "…" : ""}`,
      desc: "在新标签页搜索",
      url,
    },
  ];
}

export const search: Command = {
  id: "search",
  key: "search",
  title: "Search",
  desc: "Custom web search",
  getResultFromFilter(
    filter: string,
    context?: { searchKeyword?: string; searchEngines?: unknown[] }
  ): ResultItem[] {
    const engines = (context?.searchEngines ?? []) as SearchEngine[];
    const keyword = (context?.searchKeyword ?? "").trim().toLowerCase();
    const query = filter.trim();
    if (!query)
      return [{ id: "search-none", title: "输入搜索词", desc: "或使用 关键词 搜索词，如 g hello" }];
    const engine = keyword
      ? engines.find((e) => e.keyword.toLowerCase() === keyword)
      : engines[0];
    if (!engine)
      return [{ id: "search-err", title: "未找到搜索引擎", desc: `关键词「${keyword}」` }];
    return buildSearchResult(engine, query);
  },
};
