import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { AppConfig, GeneralConfig } from "@/types/config";
import { DEFAULT_CONFIG } from "@/types/config";
import { normalizeAppConfig } from "@/lib/configRuntime";
import { request } from "@/lib/portBridge";

export default function General() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    request<Partial<AppConfig>>({ action: "getConfig" })
      .then((c) => setConfig(normalizeAppConfig(c ?? null)))
      .catch(() => setConfig(normalizeAppConfig(null)));
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
      <div className="form-control">
        <label className="label">
          <span className="label-text">{t("emptyCommand_label")}</span>
        </label>
        <input
          type="text"
          className="input input-bordered font-mono w-full max-w-md"
          placeholder={t("emptyCommand_placeholder")}
          value={config.general.emptyCommand ?? ""}
          onChange={(e) => updateGeneral({ emptyCommand: e.target.value })}
        />
        <p className="text-sm opacity-70 mt-2">{t("emptyCommand_hint")}</p>
      </div>

      {/* AI 助手配置（OpenAI 兼容接口） */}
      <div className="pt-2 border-t border-base-content/10">
        <h3 className="text-sm font-semibold text-base-content/80 mb-3">{t("ai_section_label")}</h3>
        <div className="form-control max-w-md">
          <label className="label">
            <span className="label-text">{t("ai_base_url_label")}</span>
          </label>
          <input
            type="text"
            className="input input-bordered font-mono w-full"
            placeholder="https://api.openai.com/v1"
            value={config.general.ai?.baseUrl ?? ""}
            onChange={(e) =>
              updateGeneral({ ai: { ...(config.general.ai ?? {}), baseUrl: e.target.value } })
            }
          />
          <p className="text-sm opacity-70 mt-1">{t("ai_base_url_hint")}</p>
        </div>
        <div className="form-control max-w-md">
          <label className="label">
            <span className="label-text">{t("ai_api_key_label")}</span>
          </label>
          <input
            type="password"
            className="input input-bordered font-mono w-full"
            placeholder="sk-..."
            value={config.general.ai?.apiKey ?? ""}
            onChange={(e) =>
              updateGeneral({ ai: { ...(config.general.ai ?? {}), apiKey: e.target.value } })
            }
          />
          <p className="text-sm opacity-70 mt-1">{t("ai_api_key_hint")}</p>
        </div>
        <div className="form-control max-w-md">
          <label className="label">
            <span className="label-text">{t("ai_model_label")}</span>
          </label>
          <input
            type="text"
            className="input input-bordered font-mono w-full"
            placeholder="gpt-4o-mini"
            value={config.general.ai?.model ?? ""}
            onChange={(e) =>
              updateGeneral({ ai: { ...(config.general.ai ?? {}), model: e.target.value } })
            }
          />
          <p className="text-sm opacity-70 mt-1">{t("ai_model_hint")}</p>
        </div>
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
