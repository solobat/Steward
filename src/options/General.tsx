import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { AppConfig, GeneralConfig } from "@/types/config";
import { DEFAULT_CONFIG, DEFAULT_CUSTOM_COMMANDS } from "@/types/config";
import { request } from "@/lib/portBridge";

function mergeConfig(loaded: Partial<AppConfig> | null): AppConfig {
  if (!loaded?.general) return DEFAULT_CONFIG;
  return {
    general: { ...DEFAULT_CONFIG.general, ...loaded.general },
    plugins: { ...(DEFAULT_CONFIG.plugins ?? {}), ...(loaded.plugins ?? {}) },
    search: loaded.search
      ? {
          searchEngines: loaded.search.searchEngines?.length
            ? loaded.search.searchEngines
            : DEFAULT_CONFIG.search!.searchEngines,
          defaultSearchKeyword: loaded.search.defaultSearchKeyword ?? DEFAULT_CONFIG.search!.defaultSearchKeyword,
        }
      : DEFAULT_CONFIG.search,
    appearance: loaded.appearance
      ? { ...DEFAULT_CONFIG.appearance, ...loaded.appearance }
      : DEFAULT_CONFIG.appearance,
    customCommands: loaded.customCommands ?? DEFAULT_CUSTOM_COMMANDS,
  };
}

export default function General() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    request<Partial<AppConfig>>({ action: "getConfig" })
      .then((c) => setConfig(mergeConfig(c ?? null)))
      .catch(() => setConfig(DEFAULT_CONFIG));
  }, []);

  const updateGeneral = (patch: Partial<GeneralConfig>) => {
    setConfig((prev) => ({
      ...prev,
      general: { ...prev.general, ...patch },
    }));
    setSaved(false);
  };

  const save = () => {
    request({ action: "saveConfig", data: config })
      .then(() => setSaved(true))
      .catch(() => {});
  };

  return (
    <div className="space-y-6">
      <h2 className="options-section-title">{t("options_section_general")}</h2>
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={!!config.general.speedFirst}
            onChange={(e) => updateGeneral({ speedFirst: e.target.checked })}
          />
          <span className="label-text">{t("speedFirst_label")}</span>
        </label>
        <p className="text-sm opacity-70 ml-8">{t("speedFirst_hint")}</p>
      </div>
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={!!config.general.cacheLastCmd}
            onChange={(e) => updateGeneral({ cacheLastCmd: e.target.checked })}
          />
          <span className="label-text">{t("cacheLastCmd_label")}</span>
        </label>
        <p className="text-sm opacity-70 ml-8">{t("cacheLastCmd_hint")}</p>
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
