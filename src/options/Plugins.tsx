import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { AppConfig, PluginsConfig } from "@/types/config";
import { DEFAULT_CONFIG } from "@/types/config";
import { normalizeAppConfig } from "@/lib/configRuntime";
import { TRIGGERS } from "@/commands";
import { request } from "@/lib/portBridge";

export default function Plugins() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    request<Partial<AppConfig>>({ action: "getConfig" })
      .then((c) => setConfig(normalizeAppConfig(c ?? null)))
      .catch(() => setConfig(normalizeAppConfig(null)));
  }, []);

  const setPluginDisabled = (commandId: string, disabled: boolean) => {
    setConfig((prev) => {
      const plugins: PluginsConfig = { ...(prev.plugins ?? {}) };
      if (disabled) {
        plugins[commandId] = { ...plugins[commandId], disabled: true };
      } else {
        if (plugins[commandId]) {
          const { disabled: _d, ...rest } = plugins[commandId];
          if (Object.keys(rest).length) plugins[commandId] = rest;
          else delete plugins[commandId];
        }
      }
      return { ...prev, plugins };
    });
    setSaved(false);
  };

  const setPluginTriggerKey = (commandId: string, triggerKey: string) => {
    const trimmed = triggerKey.trim();
    setConfig((prev) => {
      const plugins: PluginsConfig = { ...(prev.plugins ?? {}) };
      if (trimmed) {
        plugins[commandId] = { ...plugins[commandId], triggerKey: trimmed };
      } else if (plugins[commandId]) {
        const { triggerKey: _k, ...rest } = plugins[commandId];
        if (Object.keys(rest).length) plugins[commandId] = rest;
        else delete plugins[commandId];
      }
      return { ...prev, plugins };
    });
    setSaved(false);
  };

  const save = () => {
    request({ action: "saveConfig", data: config })
      .then(() => setSaved(true))
      .catch(() => {});
  };

  return (
    <div className="space-y-6">
      <h2 className="options-section-title">{t("plugins_title")}</h2>
      <p className="text-sm text-base-content/70">{t("plugins_hint")}</p>
      <ul className="space-y-1.5">
        {TRIGGERS.map((cmd) => {
          const disabled = !!config.plugins?.[cmd.id]?.disabled;
          const title = t(`cmd_${cmd.id}_title`) || cmd.title;
          const desc = t(`cmd_${cmd.id}_desc`) || cmd.desc;
          const effectiveKey = config.plugins?.[cmd.id]?.triggerKey?.trim() || cmd.key;
          return (
            <li
              key={cmd.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-base-content/5 bg-base-200/50 px-3 py-2.5 hover:border-base-content/10 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {cmd.key ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-base-content/60">{t("plugins_trigger_key")}</span>
                      <input
                        type="text"
                        className="input input-bordered input-sm w-20 font-mono text-primary"
                        value={config.plugins?.[cmd.id]?.triggerKey ?? ""}
                        placeholder={cmd.key}
                        onChange={(e) => setPluginTriggerKey(cmd.id, e.target.value)}
                        title={t("plugins_trigger_key_placeholder") + ": " + cmd.key}
                      />
                    </div>
                  ) : null}
                  <span className="font-mono text-xs text-primary font-medium">{effectiveKey}</span>
                  <span className="text-base-content/90">{title}</span>
                </div>
                {desc && (
                  <p className="text-sm text-base-content/55 truncate mt-0.5">{desc}</p>
                )}
              </div>
              <label className="label cursor-pointer gap-2 shrink-0">
                <span className="label-text text-sm text-base-content/70">{disabled ? t("plugin_off") : t("plugin_on")}</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={!disabled}
                  onChange={(e) => setPluginDisabled(cmd.id, !e.target.checked)}
                />
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={save}>
          {t("btn_save")}
        </button>
        {saved && <span className="text-sm text-success">{t("saved_hint")}</span>}
      </div>
    </div>
  );
}
