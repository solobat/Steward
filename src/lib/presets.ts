/**
 * 设计风格预设：一键切换整套配色（壁纸/毛玻璃/文字/强调色）。
 * 每个预设含浅色/深色两套色板，配合「主题」开关（浅色/深色/跟随系统）使用。
 */

export interface PresetPalette {
  /** 壁纸 background-image */
  wall: string;
  /** 毛玻璃底色 */
  glass: string;
  /** 玻璃描边 */
  glassBorder: string;
  /** 分隔线 */
  sep: string;
  /** 主文字 */
  text: string;
  /** 次要文字 */
  textDim: string;
  /** 输入框占位符 */
  inputHint: string;
  /** 悬停底色 */
  hover: string;
}

export interface ThemePreset {
  id: string;
  labelKey: string;
  /** 强调色（选中项、按钮） */
  accent: string;
  /** 一键切换时默认使用的明暗 */
  defaultTheme: "light" | "dark";
  light: PresetPalette;
  dark: PresetPalette;
}

const DEFAULT_TEXT_DARK = "#f5f5f7";
const DEFAULT_DIM_DARK = "rgba(245, 245, 247, 0.55)";
const DEFAULT_HINT_DARK = "rgba(245, 245, 247, 0.38)";
const DEFAULT_HOVER_DARK = "rgba(255, 255, 255, 0.07)";
const DEFAULT_TEXT_LIGHT = "#1d1d1f";
const DEFAULT_DIM_LIGHT = "rgba(29, 29, 31, 0.55)";
const DEFAULT_HINT_LIGHT = "rgba(29, 29, 31, 0.38)";
const DEFAULT_HOVER_LIGHT = "rgba(29, 29, 31, 0.06)";

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "dark-glass",
    labelKey: "preset_dark_glass",
    accent: "#007aff",
    defaultTheme: "dark",
    dark: {
      wall: [
        "radial-gradient(130% 95% at 12% 4%, rgba(70, 96, 214, 0.5) 0%, rgba(70, 96, 214, 0) 55%)",
        "radial-gradient(110% 85% at 92% 10%, rgba(122, 78, 216, 0.38) 0%, rgba(122, 78, 216, 0) 52%)",
        "radial-gradient(120% 90% at 86% 96%, rgba(170, 66, 158, 0.22) 0%, rgba(170, 66, 158, 0) 55%)",
        "radial-gradient(100% 80% at 8% 94%, rgba(132, 76, 168, 0.2) 0%, rgba(132, 76, 168, 0) 55%)",
        "linear-gradient(150deg, #0a1022 0%, #120e2e 45%, #191040 75%, #120b2c 100%)",
      ].join(", "),
      glass: "rgba(26, 26, 34, 0.62)",
      glassBorder: "rgba(255, 255, 255, 0.12)",
      sep: "rgba(255, 255, 255, 0.08)",
      text: DEFAULT_TEXT_DARK,
      textDim: DEFAULT_DIM_DARK,
      inputHint: DEFAULT_HINT_DARK,
      hover: DEFAULT_HOVER_DARK,
    },
    light: {
      wall: [
        "radial-gradient(130% 95% at 12% 4%, rgba(168, 186, 255, 0.55) 0%, rgba(168, 186, 255, 0) 55%)",
        "radial-gradient(110% 85% at 92% 10%, rgba(198, 162, 255, 0.42) 0%, rgba(198, 162, 255, 0) 52%)",
        "radial-gradient(120% 90% at 86% 96%, rgba(255, 178, 224, 0.28) 0%, rgba(255, 178, 224, 0) 55%)",
        "radial-gradient(100% 80% at 8% 94%, rgba(255, 206, 168, 0.24) 0%, rgba(255, 206, 168, 0) 55%)",
        "linear-gradient(150deg, #eef1f9 0%, #eef0f8 45%, #f1eef9 75%, #f6f2f8 100%)",
      ].join(", "),
      glass: "rgba(255, 255, 255, 0.72)",
      glassBorder: "rgba(255, 255, 255, 0.95)",
      sep: "rgba(20, 20, 36, 0.08)",
      text: DEFAULT_TEXT_LIGHT,
      textDim: DEFAULT_DIM_LIGHT,
      inputHint: DEFAULT_HINT_LIGHT,
      hover: DEFAULT_HOVER_LIGHT,
    },
  },
  {
    id: "graphite",
    labelKey: "preset_graphite",
    accent: "#98989d",
    defaultTheme: "dark",
    dark: {
      wall: [
        "radial-gradient(120% 90% at 15% 5%, rgba(96, 96, 106, 0.28) 0%, rgba(96, 96, 106, 0) 55%)",
        "linear-gradient(155deg, #101014 0%, #181820 50%, #14141a 100%)",
      ].join(", "),
      glass: "rgba(26, 26, 30, 0.66)",
      glassBorder: "rgba(255, 255, 255, 0.1)",
      sep: "rgba(255, 255, 255, 0.08)",
      text: DEFAULT_TEXT_DARK,
      textDim: DEFAULT_DIM_DARK,
      inputHint: DEFAULT_HINT_DARK,
      hover: DEFAULT_HOVER_DARK,
    },
    light: {
      wall: [
        "radial-gradient(120% 90% at 15% 5%, rgba(120, 120, 130, 0.2) 0%, rgba(120, 120, 130, 0) 55%)",
        "linear-gradient(155deg, #f5f5f7 0%, #ececf0 50%, #e7e7ec 100%)",
      ].join(", "),
      glass: "rgba(255, 255, 255, 0.78)",
      glassBorder: "rgba(255, 255, 255, 0.95)",
      sep: "rgba(20, 20, 36, 0.08)",
      text: DEFAULT_TEXT_LIGHT,
      textDim: DEFAULT_DIM_LIGHT,
      inputHint: DEFAULT_HINT_LIGHT,
      hover: DEFAULT_HOVER_LIGHT,
    },
  },
  {
    id: "minimal-light",
    labelKey: "preset_minimal_light",
    accent: "#0a84ff",
    defaultTheme: "light",
    light: {
      wall: "linear-gradient(160deg, #ffffff 0%, #f4f5f7 60%, #eef0f3 100%)",
      glass: "rgba(255, 255, 255, 0.8)",
      glassBorder: "rgba(255, 255, 255, 1)",
      sep: "rgba(20, 20, 36, 0.07)",
      text: DEFAULT_TEXT_LIGHT,
      textDim: DEFAULT_DIM_LIGHT,
      inputHint: DEFAULT_HINT_LIGHT,
      hover: DEFAULT_HOVER_LIGHT,
    },
    dark: {
      wall: "linear-gradient(160deg, #0b0b0f 0%, #141419 60%, #101015 100%)",
      glass: "rgba(24, 24, 28, 0.7)",
      glassBorder: "rgba(255, 255, 255, 0.12)",
      sep: "rgba(255, 255, 255, 0.08)",
      text: DEFAULT_TEXT_DARK,
      textDim: DEFAULT_DIM_DARK,
      inputHint: DEFAULT_HINT_DARK,
      hover: DEFAULT_HOVER_DARK,
    },
  },
  {
    id: "sakura",
    labelKey: "preset_sakura",
    accent: "#ff2d78",
    defaultTheme: "light",
    light: {
      wall: [
        "radial-gradient(120% 90% at 20% 10%, rgba(255, 183, 213, 0.6) 0%, rgba(255, 183, 213, 0) 55%)",
        "radial-gradient(120% 90% at 85% 90%, rgba(255, 214, 235, 0.55) 0%, rgba(255, 214, 235, 0) 55%)",
        "linear-gradient(150deg, #fff5f9 0%, #ffe9f2 55%, #ffe0eb 100%)",
      ].join(", "),
      glass: "rgba(255, 255, 255, 0.72)",
      glassBorder: "rgba(255, 255, 255, 0.95)",
      sep: "rgba(80, 20, 50, 0.09)",
      text: "#33101f",
      textDim: "rgba(51, 16, 31, 0.55)",
      inputHint: "rgba(51, 16, 31, 0.38)",
      hover: "rgba(120, 30, 70, 0.06)",
    },
    dark: {
      wall: [
        "radial-gradient(120% 90% at 20% 10%, rgba(160, 60, 110, 0.35) 0%, rgba(160, 60, 110, 0) 55%)",
        "radial-gradient(120% 90% at 85% 90%, rgba(130, 50, 90, 0.3) 0%, rgba(130, 50, 90, 0) 55%)",
        "linear-gradient(150deg, #250f1b 0%, #331526 55%, #2b1120 100%)",
      ].join(", "),
      glass: "rgba(46, 22, 36, 0.62)",
      glassBorder: "rgba(255, 255, 255, 0.12)",
      sep: "rgba(255, 255, 255, 0.08)",
      text: "#fbeef4",
      textDim: "rgba(251, 238, 244, 0.55)",
      inputHint: "rgba(251, 238, 244, 0.38)",
      hover: "rgba(255, 255, 255, 0.08)",
    },
  },
  {
    id: "forest",
    labelKey: "preset_forest",
    accent: "#30d158",
    defaultTheme: "dark",
    dark: {
      wall: [
        "radial-gradient(120% 90% at 15% 8%, rgba(60, 160, 100, 0.3) 0%, rgba(60, 160, 100, 0) 55%)",
        "radial-gradient(110% 85% at 88% 92%, rgba(40, 120, 80, 0.25) 0%, rgba(40, 120, 80, 0) 55%)",
        "linear-gradient(150deg, #0a1c12 0%, #102a1a 55%, #0d2416 100%)",
      ].join(", "),
      glass: "rgba(16, 36, 24, 0.64)",
      glassBorder: "rgba(255, 255, 255, 0.12)",
      sep: "rgba(255, 255, 255, 0.08)",
      text: "#eef7f1",
      textDim: "rgba(238, 247, 241, 0.55)",
      inputHint: "rgba(238, 247, 241, 0.38)",
      hover: "rgba(255, 255, 255, 0.08)",
    },
    light: {
      wall: [
        "radial-gradient(120% 90% at 15% 8%, rgba(120, 220, 160, 0.4) 0%, rgba(120, 220, 160, 0) 55%)",
        "linear-gradient(150deg, #eef8f1 0%, #e2f3e8 55%, #e8f5ec 100%)",
      ].join(", "),
      glass: "rgba(255, 255, 255, 0.72)",
      glassBorder: "rgba(255, 255, 255, 0.95)",
      sep: "rgba(20, 40, 28, 0.08)",
      text: "#14281c",
      textDim: "rgba(20, 40, 28, 0.55)",
      inputHint: "rgba(20, 40, 28, 0.38)",
      hover: "rgba(30, 80, 50, 0.06)",
    },
  },
  {
    id: "dusk",
    labelKey: "preset_dusk",
    accent: "#bf5af2",
    defaultTheme: "dark",
    dark: {
      wall: [
        "radial-gradient(120% 90% at 15% 8%, rgba(140, 90, 240, 0.4) 0%, rgba(140, 90, 240, 0) 55%)",
        "radial-gradient(110% 85% at 90% 90%, rgba(100, 60, 200, 0.3) 0%, rgba(100, 60, 200, 0) 55%)",
        "linear-gradient(150deg, #170e2c 0%, #231443 55%, #1c1036 100%)",
      ].join(", "),
      glass: "rgba(30, 22, 44, 0.64)",
      glassBorder: "rgba(255, 255, 255, 0.13)",
      sep: "rgba(255, 255, 255, 0.08)",
      text: "#f3eefb",
      textDim: "rgba(243, 238, 251, 0.55)",
      inputHint: "rgba(243, 238, 251, 0.38)",
      hover: "rgba(255, 255, 255, 0.08)",
    },
    light: {
      wall: [
        "radial-gradient(120% 90% at 15% 8%, rgba(200, 170, 255, 0.5) 0%, rgba(200, 170, 255, 0) 55%)",
        "linear-gradient(150deg, #f6f1fc 0%, #ece2fa 55%, #f1e9fb 100%)",
      ].join(", "),
      glass: "rgba(255, 255, 255, 0.72)",
      glassBorder: "rgba(255, 255, 255, 0.95)",
      sep: "rgba(40, 24, 70, 0.08)",
      text: "#241636",
      textDim: "rgba(36, 22, 54, 0.55)",
      inputHint: "rgba(36, 22, 54, 0.38)",
      hover: "rgba(80, 40, 140, 0.06)",
    },
  },
  {
    id: "sunset",
    labelKey: "preset_sunset",
    accent: "#ff9f0a",
    defaultTheme: "light",
    light: {
      wall: [
        "radial-gradient(120% 90% at 18% 8%, rgba(255, 190, 110, 0.55) 0%, rgba(255, 190, 110, 0) 55%)",
        "radial-gradient(120% 90% at 85% 92%, rgba(255, 150, 90, 0.5) 0%, rgba(255, 150, 90, 0) 55%)",
        "linear-gradient(150deg, #fff6ec 0%, #ffe9d4 55%, #ffe2c9 100%)",
      ].join(", "),
      glass: "rgba(255, 255, 255, 0.7)",
      glassBorder: "rgba(255, 255, 255, 0.95)",
      sep: "rgba(90, 45, 10, 0.09)",
      text: "#33200e",
      textDim: "rgba(51, 32, 14, 0.55)",
      inputHint: "rgba(51, 32, 14, 0.38)",
      hover: "rgba(120, 60, 20, 0.06)",
    },
    dark: {
      wall: [
        "radial-gradient(120% 90% at 18% 8%, rgba(200, 120, 50, 0.35) 0%, rgba(200, 120, 50, 0) 55%)",
        "radial-gradient(120% 90% at 85% 92%, rgba(160, 80, 40, 0.28) 0%, rgba(160, 80, 40, 0) 55%)",
        "linear-gradient(150deg, #241205 0%, #331a0b 55%, #2a150a 100%)",
      ].join(", "),
      glass: "rgba(38, 24, 14, 0.62)",
      glassBorder: "rgba(255, 255, 255, 0.12)",
      sep: "rgba(255, 255, 255, 0.08)",
      text: "#fbf3ea",
      textDim: "rgba(251, 243, 234, 0.55)",
      inputHint: "rgba(251, 243, 234, 0.38)",
      hover: "rgba(255, 255, 255, 0.08)",
    },
  },
  {
    id: "ocean",
    labelKey: "preset_ocean",
    accent: "#64d2ff",
    defaultTheme: "dark",
    dark: {
      wall: [
        "radial-gradient(120% 90% at 15% 8%, rgba(70, 160, 230, 0.35) 0%, rgba(70, 160, 230, 0) 55%)",
        "radial-gradient(110% 85% at 90% 92%, rgba(40, 110, 180, 0.3) 0%, rgba(40, 110, 180, 0) 55%)",
        "linear-gradient(150deg, #07202e 0%, #0b2c40 55%, #082334 100%)",
      ].join(", "),
      glass: "rgba(16, 34, 44, 0.64)",
      glassBorder: "rgba(255, 255, 255, 0.12)",
      sep: "rgba(255, 255, 255, 0.08)",
      text: "#ecf6fb",
      textDim: "rgba(236, 246, 251, 0.55)",
      inputHint: "rgba(236, 246, 251, 0.38)",
      hover: "rgba(255, 255, 255, 0.08)",
    },
    light: {
      wall: [
        "radial-gradient(120% 90% at 15% 8%, rgba(150, 220, 255, 0.5) 0%, rgba(150, 220, 255, 0) 55%)",
        "radial-gradient(110% 85% at 90% 92%, rgba(130, 200, 245, 0.4) 0%, rgba(130, 200, 245, 0) 55%)",
        "linear-gradient(150deg, #eef9fd 0%, #dcf0fa 55%, #e4f4fc 100%)",
      ].join(", "),
      glass: "rgba(255, 255, 255, 0.72)",
      glassBorder: "rgba(255, 255, 255, 0.95)",
      sep: "rgba(10, 40, 60, 0.08)",
      text: "#122a38",
      textDim: "rgba(18, 42, 56, 0.55)",
      inputHint: "rgba(18, 42, 56, 0.38)",
      hover: "rgba(20, 80, 120, 0.06)",
    },
  },
];

export const DEFAULT_PRESET_ID = "dark-glass";

export function getPreset(id: string | undefined | null): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

/** 预设 → CSS 变量覆盖（作用于 documentElement 或预览容器） */
export function presetVarOverrides(preset: ThemePreset, theme: "light" | "dark"): Record<string, string> {
  const p = theme === "dark" ? preset.dark : preset.light;
  return {
    "--steward-wall": p.wall,
    "--steward-glass": p.glass,
    "--steward-glass-border": p.glassBorder,
    "--steward-sep": p.sep,
    "--steward-text": p.text,
    "--steward-text-dim": p.textDim,
    "--steward-input-hint": p.inputHint,
    "--steward-hover": p.hover,
  };
}

/** 将变量覆盖应用到指定元素 */
export function applyPresetVars(root: HTMLElement, presetId: string | undefined | null, theme: "light" | "dark"): void {
  const preset = getPreset(presetId);
  const vars = presetVarOverrides(preset, theme);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}
