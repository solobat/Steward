import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type {
  AppConfig,
  AppearanceConfig,
  AppearanceTheme,
  AppearanceFontSize,
  AppearanceDensity,
  AppearanceRadius,
  AppearanceSize,
} from "@/types/config";
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

const THEME_OPTIONS: { value: AppearanceTheme; labelKey: string }[] = [
  { value: "light", labelKey: "appearance_theme_light" },
  { value: "dark", labelKey: "appearance_theme_dark" },
  { value: "system", labelKey: "appearance_theme_system" },
];

const FONT_SIZE_OPTIONS: { value: AppearanceFontSize; labelKey: string }[] = [
  { value: "small", labelKey: "appearance_size_small" },
  { value: "medium", labelKey: "appearance_size_medium" },
  { value: "large", labelKey: "appearance_size_large" },
];

const DENSITY_OPTIONS: { value: AppearanceDensity; labelKey: string }[] = [
  { value: "compact", labelKey: "appearance_density_compact" },
  { value: "default", labelKey: "appearance_density_default" },
  { value: "relaxed", labelKey: "appearance_density_relaxed" },
];

const RADIUS_OPTIONS: { value: AppearanceRadius; labelKey: string }[] = [
  { value: "sharp", labelKey: "appearance_radius_sharp" },
  { value: "default", labelKey: "appearance_radius_default" },
  { value: "round", labelKey: "appearance_radius_round" },
];

const SIZE_OPTIONS: { value: AppearanceSize; labelKey: string }[] = [
  { value: "small", labelKey: "appearance_size_small" },
  { value: "medium", labelKey: "appearance_size_medium" },
  { value: "large", labelKey: "appearance_size_large" },
];

const PRESET_COLORS = [
  "",
  "#570df8",
  "#65c3c8",
  "#f87272",
  "#fbbd23",
  "#36d399",
  "#a78bfa",
  "#f472b6",
];

// 字号/高度映射（预览与命令框共用）
function sizeToPx(size: AppearanceSize | undefined, kind: "font" | "title" | "subtitle" | "inputHeight"): string {
  if (kind === "inputHeight") {
    if (size === "small") return "32px";
    if (size === "large") return "48px";
    return "40px";
  }
  if (kind === "title") {
    if (size === "small") return "12px";
    if (size === "large") return "16px";
    return "14px";
  }
  if (kind === "subtitle") {
    if (size === "small") return "10px";
    if (size === "large") return "13px";
    return "12px";
  }
  if (size === "small") return "13px";
  if (size === "large") return "16px";
  return "14px";
}

export default function Appearance() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const userEditedAppearanceRef = useRef(false);

  useEffect(() => {
    request<Partial<AppConfig>>({ action: "getConfig" })
      .then((c) => {
        const loaded = mergeConfig(c ?? null);
        setConfig((prev) =>
          userEditedAppearanceRef.current
            ? { ...loaded, appearance: prev.appearance ?? loaded.appearance }
            : loaded
        );
      })
      .catch(() => setConfig(DEFAULT_CONFIG));
  }, []);

  const appearance: AppearanceConfig = config.appearance ?? DEFAULT_CONFIG.appearance!;

  const setAppearance = (patch: Partial<AppearanceConfig>) => {
    userEditedAppearanceRef.current = true;
    setConfig((prev) => ({
      ...prev,
      appearance: { ...(prev.appearance ?? DEFAULT_CONFIG.appearance), ...patch },
    }));
    setSaved(false);
  };

  const resetToDefaultAppearance = () => {
    userEditedAppearanceRef.current = true;
    setConfig((prev) => ({
      ...prev,
      appearance: { ...DEFAULT_CONFIG.appearance },
    }));
    setSaved(false);
  };

  const save = () => {
    request({ action: "saveConfig", data: config })
      .then(() => setSaved(true))
      .catch(() => {});
  };

  const primaryColor = (appearance.primaryColor ?? "").trim();
  const resolvedTheme =
    (appearance.theme ?? "system") === "system"
      ? (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : (appearance.theme as "light" | "dark");
  const radiusClass =
    appearance.cornerRadius === "sharp"
      ? "rounded-none"
      : appearance.cornerRadius === "round"
        ? "rounded-2xl"
        : "rounded-lg";
  const previewFontSize =
    appearance.fontSize === "small" ? "13px" : appearance.fontSize === "large" ? "16px" : "14px";
  const previewStyle: Record<string, string> = { fontSize: previewFontSize };
  if (primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    const r = parseInt(primaryColor.slice(1, 3), 16) / 255;
    const g = parseInt(primaryColor.slice(3, 5), 16) / 255;
    const b = parseInt(primaryColor.slice(5, 7), 16) / 255;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    previewStyle["--p"] = primaryColor;
    previewStyle["--pc"] = luma > 0.5 ? "oklch(0.15 0.02 260)" : "oklch(0.99 0 0)";
  }

  // 强制同步预览 DOM：避免 React 或 CSS 未生效时预览不更新
  useEffect(() => {
    const wrap = previewRef.current;
    const box = previewBoxRef.current;
    if (!wrap) return;
    wrap.setAttribute("data-theme", resolvedTheme);
    wrap.setAttribute("data-density", appearance.listDensity ?? "default");
    wrap.style.fontSize = previewFontSize;
    // 主题背景：确保切换浅/深色时预览区明显变化（不依赖 DaisyUI 嵌套）
    if (resolvedTheme === "dark") {
      wrap.style.backgroundColor = "oklch(0.165 0.005 260)";
      wrap.style.color = "oklch(0.95 0 0)";
    } else {
      wrap.style.backgroundColor = "oklch(0.97 0.005 260)";
      wrap.style.color = "oklch(0.15 0.02 260)";
    }
    wrap.style.padding = "1rem";
    wrap.style.borderRadius = "0.5rem";
    if (primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      wrap.style.setProperty("--p", primaryColor);
      const r = parseInt(primaryColor.slice(1, 3), 16) / 255;
      const g = parseInt(primaryColor.slice(3, 5), 16) / 255;
      const b = parseInt(primaryColor.slice(5, 7), 16) / 255;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      wrap.style.setProperty("--pc", luma > 0.5 ? "oklch(0.15 0.02 260)" : "oklch(0.99 0 0)");
    } else {
      wrap.style.removeProperty("--p");
      wrap.style.removeProperty("--pc");
    }
    if (box) {
      box.style.borderRadius =
        appearance.cornerRadius === "sharp" ? "0" : appearance.cornerRadius === "round" ? "1rem" : "0.5rem";
      if (appearance.boxBackground && /^#[0-9A-Fa-f]{6}$/.test(appearance.boxBackground))
        box.style.backgroundColor = appearance.boxBackground;
      else
        box.style.removeProperty("backgroundColor");
    }
    const inputRow = wrap.querySelector(".steward-preview-input-row") as HTMLElement | null;
    if (inputRow)
      inputRow.style.minHeight = sizeToPx(appearance.inputHeight ?? "medium", "inputHeight");
    wrap.querySelectorAll(".steward-preview-box .menu li a").forEach((a) => {
      const spans = (a as HTMLElement).querySelectorAll("span");
      if (spans[0]) (spans[0] as HTMLElement).style.fontSize = sizeToPx(appearance.titleSize ?? "medium", "title");
      if (spans[1]) (spans[1] as HTMLElement).style.fontSize = sizeToPx(appearance.subtitleSize ?? "medium", "subtitle");
    });
  }, [
    resolvedTheme,
    appearance.listDensity,
    appearance.cornerRadius,
    appearance.inputHeight,
    appearance.boxBackground,
    appearance.titleSize,
    appearance.subtitleSize,
    previewFontSize,
    primaryColor,
  ]);

  return (
    <div className="space-y-8">
      <h2 className="options-section-title">{t("appearance_title")}</h2>
      <p className="text-sm text-base-content/70">{t("appearance_hint")}</p>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-base-content/80 border-b border-base-content/10 pb-1">
          {t("appearance_preview_title")}
        </h3>
        <p className="text-xs text-base-content/50">{t("appearance_preview_hint")}</p>
        <div
          ref={previewRef}
          className="steward-appearance-preview"
          data-theme={resolvedTheme}
          data-density={appearance.listDensity ?? "default"}
          style={previewStyle}
        >
          <div
            ref={previewBoxRef}
            className={`steward-preview-box flex flex-col bg-base-200 shadow-xl min-h-[200px] w-full max-w-sm ${radiusClass}`}
            style={{
              borderRadius: appearance.cornerRadius === "sharp" ? "0" : appearance.cornerRadius === "round" ? "1rem" : "0.5rem",
              ...(appearance.boxBackground && /^#[0-9A-Fa-f]{6}$/.test(appearance.boxBackground)
                ? { backgroundColor: appearance.boxBackground }
                : {}),
            }}
          >
            <div className="steward-preview-input-row p-3 border-b border-base-300 flex items-center">
              <input
                type="text"
                placeholder={t("appearance_placeholder_trigger")}
                className="input input-bordered input-sm w-full bg-base-100 font-mono text-base-content"
                readOnly
              />
            </div>
            <ul className="menu flex-1 p-2 bg-base-200 min-h-[120px]">
              <li>
                <a className="active">
                  <span className="font-medium">bm</span>
                  <span className="text-sm opacity-70 block truncate">{t("cmd_bm_title")}</span>
                </a>
              </li>
              <li>
                <a>
                  <span className="font-medium">his</span>
                  <span className="text-sm opacity-70 block truncate">{t("cmd_his_title")}</span>
                </a>
              </li>
              <li>
                <a>
                  <span className="font-medium">tab</span>
                  <span className="text-sm opacity-70 block truncate">{t("cmd_tab_title")}</span>
                </a>
              </li>
            </ul>
            <div className="p-2 text-xs opacity-60 border-t border-base-300 font-mono">
              {t("appearance_preview_hint_keys")}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-base-content/80 border-b border-base-content/10 pb-1">
          {t("appearance_theme_label")} / {t("appearance_accent_label")}
        </h3>
        <div className="form-control max-w-xs">
          <label className="label">
            <span className="label-text">{t("appearance_theme_label")}</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={appearance.theme ?? "system"}
            onChange={(e) => setAppearance({ theme: e.target.value as AppearanceTheme })}
          >
            {THEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t("appearance_accent_label")}</span>
            <span className="label-text-alt">{t("appearance_accent_alt")}</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map((hex) => (
              <button
                key={hex || "default"}
                type="button"
                className={`btn btn-sm btn-square h-8 w-8 p-0 ${
                  primaryColor === hex ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100" : ""
                } ${!hex ? "bg-base-300" : ""}`}
                style={hex ? { backgroundColor: hex } : undefined}
                title={hex ? undefined : t("appearance_default_color")}
                onClick={() => setAppearance({ primaryColor: hex })}
              >
                {!hex && <span className="text-xs">默认</span>}
              </button>
            ))}
            <input
              type="color"
              className="w-8 h-8 cursor-pointer rounded border border-base-content/20"
              value={primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : "#570df8"}
              onChange={(e) => setAppearance({ primaryColor: e.target.value })}
              title={t("appearance_custom_color")}
            />
            {primaryColor && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setAppearance({ primaryColor: "" })}
              >
                清除
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-base-content/80 border-b border-base-content/10 pb-1">
          字号
        </h3>
        <div className="form-control max-w-xs">
          <label className="label">
            <span className="label-text">{t("appearance_font_size_label")}</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={appearance.fontSize ?? "medium"}
            onChange={(e) => setAppearance({ fontSize: e.target.value as AppearanceFontSize })}
          >
            {FONT_SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-base-content/80 border-b border-base-content/10 pb-1">
          布局
        </h3>
        <div className="form-control max-w-xs">
          <label className="label">
            <span className="label-text">{t("appearance_input_height_label")}</span>
            <span className="label-text-alt">{t("appearance_input_height_alt")}</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={appearance.inputHeight ?? "medium"}
            onChange={(e) => setAppearance({ inputHeight: e.target.value as AppearanceSize })}
          >
            {SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-control max-w-xs">
          <label className="label">
            <span className="label-text">{t("appearance_density_label")}</span>
            <span className="label-text-alt">{t("appearance_density_alt")}</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={appearance.listDensity ?? "default"}
            onChange={(e) => setAppearance({ listDensity: e.target.value as AppearanceDensity })}
          >
            {DENSITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-control max-w-xs">
          <label className="label">
            <span className="label-text">{t("appearance_radius_label")}</span>
            <span className="label-text-alt">{t("appearance_radius_alt")}</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={appearance.cornerRadius ?? "default"}
            onChange={(e) => setAppearance({ cornerRadius: e.target.value as AppearanceRadius })}
          >
            {RADIUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-base-content/80 border-b border-base-content/10 pb-1">
          列表与框体
        </h3>
        <div className="form-control max-w-xs">
          <label className="label">
            <span className="label-text">{t("appearance_title_size_label")}</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={appearance.titleSize ?? "medium"}
            onChange={(e) => setAppearance({ titleSize: e.target.value as AppearanceSize })}
          >
            {SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-control max-w-xs">
          <label className="label">
            <span className="label-text">{t("appearance_subtitle_size_label")}</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={appearance.subtitleSize ?? "medium"}
            onChange={(e) => setAppearance({ subtitleSize: e.target.value as AppearanceSize })}
          >
            {SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-control max-w-md">
          <label className="label">
            <span className="label-text">{t("appearance_box_bg_label")}</span>
            <span className="label-text-alt">{t("appearance_box_bg_alt")}</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              className="w-8 h-8 cursor-pointer rounded border border-base-content/20"
              value={
                appearance.boxBackground && /^#[0-9A-Fa-f]{6}$/.test(appearance.boxBackground)
                  ? appearance.boxBackground
                  : "#e5e7eb"
              }
              onChange={(e) => setAppearance({ boxBackground: e.target.value })}
              title={t("appearance_custom_color")}
            />
            <input
              type="text"
              className="input input-bordered input-sm w-24 font-mono"
              placeholder="#hex"
              value={appearance.boxBackground ?? ""}
              onChange={(e) => setAppearance({ boxBackground: e.target.value.trim() })}
            />
            {appearance.boxBackground && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAppearance({ boxBackground: "" })}>
                {t("appearance_clear_bg")}
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 pt-2">
        <button type="button" className="btn btn-primary" onClick={save}>
          {t("btn_save")}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={resetToDefaultAppearance}>
          {t("appearance_reset_theme")}
        </button>
        {saved && <span className="text-sm text-success">{t("saved_hint")}</span>}
      </div>
    </div>
  );
}
