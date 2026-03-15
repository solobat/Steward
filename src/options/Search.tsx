import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { AppConfig, SearchConfig, SearchEngine } from "@/types/config";
import { DEFAULT_CONFIG } from "@/types/config";
import { request } from "@/lib/portBridge";

function mergeConfig(loaded: Partial<AppConfig> | null): AppConfig {
  if (!loaded?.general) return DEFAULT_CONFIG;
  return {
    general: { ...DEFAULT_CONFIG.general, ...loaded.general },
    plugins: { ...(DEFAULT_CONFIG.plugins ?? {}), ...(loaded.plugins ?? {}) },
    search: loaded.search
      ? {
          searchEngines: loaded.search.searchEngines?.length ? loaded.search.searchEngines : DEFAULT_CONFIG.search!.searchEngines,
          defaultSearchKeyword: loaded.search.defaultSearchKeyword ?? DEFAULT_CONFIG.search!.defaultSearchKeyword,
        }
      : DEFAULT_CONFIG.search,
    appearance: loaded.appearance
      ? { ...DEFAULT_CONFIG.appearance, ...loaded.appearance }
      : DEFAULT_CONFIG.appearance,
  };
}

export default function Search() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    request<Partial<AppConfig>>({ action: "getConfig" })
      .then((c) => setConfig(mergeConfig(c ?? null)))
      .catch(() => setConfig(DEFAULT_CONFIG));
  }, []);

  const searchConfig: SearchConfig = config.search ?? DEFAULT_CONFIG.search!;
  const engines = searchConfig.searchEngines;
  const defaultKeyword = searchConfig.defaultSearchKeyword;

  const setSearch = (patch: Partial<SearchConfig>) => {
    setConfig((prev) => ({
      ...prev,
      search: { ...(prev.search ?? DEFAULT_CONFIG.search!), ...patch },
    }));
    setSaved(false);
  };

  const addEngine = () => {
    const id = `e-${Date.now()}`;
    setSearch({
      searchEngines: [...engines, { id, keyword: "", name: "", urlTemplate: "https://www.google.com/search?q={query}" }],
    });
  };

  const updateEngine = (id: string, patch: Partial<SearchEngine>) => {
    setSearch({
      searchEngines: engines.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const removeEngine = (id: string) => {
    const next = engines.filter((e) => e.id !== id);
    setSearch({
      searchEngines: next,
      defaultSearchKeyword: defaultKeyword && next.some((e) => e.keyword === defaultKeyword) ? defaultKeyword : next[0]?.keyword ?? "",
    });
  };

  const save = () => {
    request({ action: "saveConfig", data: config })
      .then(() => setSaved(true))
      .catch(() => {});
  };

  return (
    <div className="space-y-6">
      <h2 className="options-section-title">{t("search_title")}</h2>
      <p className="text-sm text-base-content/70">{t("search_hint")}</p>
      <div className="form-control">
        <label className="label">
          <span className="label-text">{t("search_default_label")}</span>
        </label>
        <select
          className="select select-bordered w-full max-w-xs"
          value={defaultKeyword}
          onChange={(e) => setSearch({ defaultSearchKeyword: e.target.value })}
        >
          {engines.map((e) => (
            <option key={e.id} value={e.keyword}>
              {e.keyword} - {e.name || t("search_unnamed")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label-text font-medium">{t("search_engines_label")}</span>
          <button type="button" className="btn btn-sm btn-outline" onClick={addEngine}>
            {t("search_add")}
          </button>
        </div>
        <ul className="space-y-3">
          {engines.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2 p-3 bg-base-200 rounded-lg">
              <input
                type="text"
                className="input input-bordered input-sm w-16"
                placeholder={t("search_placeholder_keyword")}
                value={e.keyword}
                onChange={(ev) => updateEngine(e.id, { keyword: ev.target.value })}
              />
              <input
                type="text"
                className="input input-bordered input-sm w-24"
                placeholder={t("search_placeholder_name")}
                value={e.name}
                onChange={(ev) => updateEngine(e.id, { name: ev.target.value })}
              />
              <input
                type="text"
                className="input input-bordered input-sm flex-1 min-w-[200px] font-mono text-sm"
                placeholder={t("search_placeholder_url")}
                value={e.urlTemplate}
                onChange={(ev) => updateEngine(e.id, { urlTemplate: ev.target.value })}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm text-error"
                onClick={() => removeEngine(e.id)}
              >
                {t("btn_delete")}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={save}>
          {t("btn_save")}
        </button>
        {saved && <span className="text-sm text-success">{t("saved_hint")}</span>}
      </div>
    </div>
  );
}
