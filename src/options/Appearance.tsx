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
import { DEFAULT_CONFIG } from "@/types/config";
import { normalizeAppConfig } from "@/lib/configRuntime";
import { request } from "@/lib/portBridge";
import { THEME_PRESETS, DEFAULT_PRESET_ID, getPreset, presetVarOverrides, applyPresetVars } from "@/lib/presets";

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
  "#007AFF",
  "#570df8",
  "#65c3c8",
  "#f87272",
  "#fbbd23",
  "#36d399",
  "#a78bfa",
  "#f472b6",
];

function resolveTheme(theme: AppearanceTheme): "light" | "dark" {
  if (theme === "system") {
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

/** 弹窗模式圆角（贴合浏览器外框） */
const RADIUS_PX: Record<AppearanceRadius, string> = {
  sharp: "0",
  default: "0.375rem",
  round: "0.625rem",
};
/** 页面内模式：外圆角由 iframe 容器（20px）提供 */
const PAGE_RADIUS = "1.25rem";

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
  const [previewHost, setPreviewHost] = useState<"popup" | "page">("popup");
  const previewRef = useRef<HTMLDivElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const userEditedAppearanceRef = useRef(false);

  useEffect(() => {
    request<Partial<AppConfig>>({ action: "getConfig" })
      .then((c) => {
        const loaded = normalizeAppConfig(c ?? null);
        setConfig((prev) =>
          userEditedAppearanceRef.current
            ? { ...loaded, appearance: prev.appearance ?? loaded.appearance }
            : loaded
        );
      })
      .catch(() => setConfig(normalizeAppConfig(null)));
  }, []);

  const appearance: AppearanceConfig = config.appearance ?? DEFAULT_CONFIG.appearance!;
  const primaryColor = (appearance.primaryColor ?? "").trim();
  const resolvedTheme = resolveTheme(appearance.theme ?? "system");
  const preset = getPreset(appearance.preset);
  /** 有效强调色：用户自定义优先，否则预设强调色 */
  const effectiveAccent = primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : preset.accent;

  /** 让整个选项页即时跟随主题 + 预设（色板/强调色） */
  const applyPageAppearance = (theme: AppearanceTheme, presetId?: string) => {
    const p = getPreset(presetId ?? appearance.preset);
    const resolved = resolveTheme(theme);
    const el = document.documentElement;
    el.setAttribute("data-theme", resolved);
    applyPresetVars(el, p.id, resolved);
    const accent = primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : p.accent;
    el.style.setProperty("--steward-accent", accent);
    el.style.setProperty("--p", accent);
    el.style.setProperty("--pc", "oklch(0.99 0 0)");
  };

  const setAppearance = (patch: Partial<AppearanceConfig>) => {
    userEditedAppearanceRef.current = true;
    if (patch.theme || patch.preset || patch.primaryColor !== undefined) {
      applyPageAppearance(patch.theme ?? appearance.theme ?? "system", patch.preset);
    }
    setConfig((prev) => ({
      ...prev,
      appearance: { ...(prev.appearance ?? DEFAULT_CONFIG.appearance), ...patch },
    }));
    setSaved(false);
  };

  /** 一键切换设计风格预设 */
  const selectPreset = (id: string) => {
    const p = getPreset(id);
    setAppearance({ preset: p.id, theme: p.defaultTheme, primaryColor: p.accent });
  };

  const resetToDefaultAppearance = () => {
    userEditedAppearanceRef.current = true;
    setConfig((prev) => ({
      ...prev,
      appearance: { ...DEFAULT_CONFIG.appearance },
    }));
    applyPageAppearance(DEFAULT_CONFIG.appearance!.theme ?? "system", DEFAULT_PRESET_ID);
    setSaved(false);
  };

  const save = () => {
    request({ action: "saveConfig", data: config })
      .then(() => setSaved(true))
      .catch(() => {});
  };

  const previewFontSize =
    appearance.fontSize === "small" ? "13px" : appearance.fontSize === "large" ? "16px" : "14px";
  // 预览容器：预设色板（按当前明暗）+ 有效强调色 + 字号
  const previewStyle: Record<string, string> = {
    fontSize: previewFontSize,
    ...presetVarOverrides(preset, resolvedTheme),
    "--steward-accent": effectiveAccent,
    "--p": effectiveAccent,
    "--pc": "oklch(0.99 0 0)",
  };
  const boxRadius = previewHost === "page" ? PAGE_RADIUS : RADIUS_PX[appearance.cornerRadius ?? "default"];

  // 同步预览 DOM：字号、密度、圆角、背景色、输入行高度（与命令框一致）
  useEffect(() => {
    const wrap = previewRef.current;
    const box = previewBoxRef.current;
    if (!wrap) return;
    wrap.setAttribute("data-theme", resolvedTheme);
    wrap.setAttribute("data-density", appearance.listDensity ?? "default");
    wrap.style.fontSize = previewFontSize;
    if (box) {
      box.style.borderRadius = boxRadius;
      if (appearance.boxBackground && /^#[0-9A-Fa-f]{6}$/.test(appearance.boxBackground))
        box.style.backgroundColor = appearance.boxBackground;
      else
        box.style.removeProperty("backgroundColor");
    }
    const inputRow = wrap.querySelector(".steward-search-row") as HTMLElement | null;
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
    boxRadius,
  ]);

  return (
    <div className="space-y-8">
      <h2 className="options-section-title">{t("appearance_title")}</h2>
      <p className="text-sm text-base-content/70">{t("appearance_hint")}</p>

      {/* 设计风格预设：一键切换 */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-base-content/80 border-b border-base-content/10 pb-1">
          {t("appearance_preset_label")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {THEME_PRESETS.map((p) => {
            const active = (appearance.preset ?? DEFAULT_PRESET_ID) === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`text-left rounded-xl border p-2 transition-colors ${
                  active
                    ? "border-primary ring-1 ring-primary"
                    : "border-base-content/10 hover:border-base-content/30"
                }`}
                onClick={() => selectPreset(p.id)}
              >
                <span
                  className="block h-12 rounded-lg border border-base-content/10 overflow-hidden"
                  style={{ backgroundImage: p[p.defaultTheme].wall, backgroundSize: "cover" }}
                />
                <span className="mt-1.5 flex items-center justify-between gap-1">
                  <span className="text-xs font-medium truncate">{t(p.labelKey)}</span>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.accent }} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-base-content/80 border-b border-base-content/10 pb-1">
          {t("appearance_preview_title")}
        </h3>
        <p className="text-xs text-base-content/50">{t("appearance_preview_hint")}</p>
        {/* 宿主环境切换：弹窗 / 页面内，预览尽可能还原真实效果 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-base-content/60">{t("appearance_preview_host_label")}</span>
          <div className="join join-sm">
            <button
              type="button"
              className={`btn btn-sm join-item ${previewHost === "popup" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPreviewHost("popup")}
            >
              {t("appearance_preview_host_popup")}
            </button>
            <button
              type="button"
              className={`btn btn-sm join-item ${previewHost === "page" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPreviewHost("page")}
            >
              {t("appearance_preview_host_page")}
            </button>
          </div>
        </div>
        <div
          ref={previewRef}
          className={`steward-wall steward-appearance-preview rounded-xl overflow-hidden ${
            previewHost === "page" ? "steward-preview-iframe" : ""
          }`}
          data-theme={resolvedTheme}
          data-density={appearance.listDensity ?? "default"}
          style={previewStyle}
        >
          {/* 页面内模式：页面暗色遮罩（模拟真实宿主页面） */}
          <div className="steward-preview-backdrop" aria-hidden />
          <div
            ref={previewBoxRef}
            className="steward-glass steward-preview-box flex flex-col min-h-[280px] w-full"
            style={{
              borderRadius: boxRadius,
              ...(appearance.boxBackground && /^#[0-9A-Fa-f]{6}$/.test(appearance.boxBackground)
                ? { backgroundColor: appearance.boxBackground }
                : {}),
            }}
          >
            <div className="steward-search-row p-3 border-b flex items-center gap-2">
              <svg
                className="steward-search-icon w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
              <input
                type="text"
                placeholder={t("appearance_placeholder_trigger")}
                className="steward-search-input input input-sm w-full"
                readOnly
              />
            </div>
            <ul className="menu flex-1 p-2 min-h-[120px]">
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
            <div className="steward-foot p-2 text-xs border-t">
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
              value={effectiveAccent}
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
