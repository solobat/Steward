import { useEffect, useState } from "react";
import type { AppConfig, GeneralConfig } from "@/types/config";
import { DEFAULT_CONFIG } from "@/types/config";
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
      <h2 className="options-section-title">通用</h2>
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={!!config.general.speedFirst}
            onChange={(e) => updateGeneral({ speedFirst: e.target.checked })}
          />
          <span className="label-text">速度优先</span>
        </label>
        <p className="text-sm opacity-70 ml-8">
          开启后扩展在页面加载时即注入命令框，打开更快；关闭则首次按快捷键再注入以节省内存。
        </p>
      </div>
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={!!config.general.cacheLastCmd}
            onChange={(e) => updateGeneral({ cacheLastCmd: e.target.checked })}
          />
          <span className="label-text">记忆上次命令</span>
        </label>
        <p className="text-sm opacity-70 ml-8">下次打开命令框时预填上次使用的命令。</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={save}>
          保存
        </button>
        {saved && <span className="text-sm text-success">已保存</span>}
      </div>
    </div>
  );
}
