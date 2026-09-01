import { useEffect, useState } from "react";
import CmdBox, { isInIframe } from "./CmdBox";
import { request } from "@/lib/portBridge";
import { applyPresetVars, getPreset } from "@/lib/presets";
import type { AppearanceConfig, AppearanceTheme } from "@/types/config";

function resolveTheme(theme: AppearanceTheme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

/** 强调色：用户自定义优先，否则用预设强调色（始终生效，保证选中项/按钮跟随主题） */
function applyAccent(accent: string) {
  const el = document.documentElement;
  el.style.setProperty("--steward-accent", accent);
  el.style.setProperty("--p", accent);
  if (/^#[0-9A-Fa-f]{6}$/.test(accent)) {
    const r = parseInt(accent.slice(1, 3), 16) / 255;
    const g = parseInt(accent.slice(3, 5), 16) / 255;
    const b = parseInt(accent.slice(5, 7), 16) / 255;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    el.style.setProperty("--pc", luma > 0.5 ? "oklch(0.15 0.02 260)" : "oklch(0.99 0 0)");
  } else {
    el.style.setProperty("--pc", "oklch(0.99 0 0)");
  }
}

function applyAppearance(appearance: AppearanceConfig | null) {
  const theme = appearance?.theme ?? "system";
  const fontSize = appearance?.fontSize ?? "medium";
  const primaryColor = (appearance?.primaryColor ?? "").trim();
  const listDensity = appearance?.listDensity ?? "default";
  const cornerRadius = appearance?.cornerRadius ?? "default";
  const resolved = resolveTheme(theme);

  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.classList.remove("steward-fs-small", "steward-fs-medium", "steward-fs-large");
  document.documentElement.classList.add(`steward-fs-${fontSize}`);
  document.documentElement.dataset.density = listDensity;
  document.documentElement.dataset.radius = cornerRadius;

  // 设计风格预设（壁纸/玻璃/文字色板）
  const preset = getPreset(appearance?.preset);
  applyPresetVars(document.documentElement, preset.id, resolved);

  // 强调色：自定义优先，否则预设色
  const accent = primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : preset.accent;
  applyAccent(accent);
}

export default function App() {
  const inIframe = isInIframe();
  const [appearance, setAppearance] = useState<AppearanceConfig | undefined>(undefined);

  useEffect(() => {
    if (inIframe) document.documentElement.classList.add("steward-in-iframe");
    return () => document.documentElement.classList.remove("steward-in-iframe");
  }, [inIframe]);

  useEffect(() => {
    const update = (config: { appearance?: AppearanceConfig } | null) => {
      const next = config?.appearance ?? undefined;
      setAppearance(next);
      applyAppearance(next ?? null);
    };

    request<{ config?: { appearance?: AppearanceConfig } }>({ action: "getData" })
      .then((data) => update(data?.config ?? null))
      .catch(() => applyAppearance(null));

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "sync" && changes.config) {
        const next = (changes.config.newValue as { appearance?: AppearanceConfig })?.appearance ?? undefined;
        update({ appearance: next });
      }
    };
    const onSystemTheme = () => {
      request<{ config?: { appearance?: AppearanceConfig } }>({ action: "getData" }).then(
        (data) => {
          const a = data?.config?.appearance;
          const t = a?.theme ?? "system";
          if (t === "system") {
            const resolved = media.matches ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", resolved);
            // 跟随系统时，预设色板也要跟着切
            const preset = getPreset(a?.preset);
            applyPresetVars(document.documentElement, preset.id, resolved);
          }
        }
      );
    };

    chrome.storage.onChanged.addListener(onStorage);
    media.addEventListener("change", onSystemTheme);
    return () => {
      chrome.storage.onChanged.removeListener(onStorage);
      media.removeEventListener("change", onSystemTheme);
    };
  }, []);

  return (
    <div className={inIframe ? "h-full min-h-screen" : "min-w-[420px]"}>
      <CmdBox appearance={appearance} />
    </div>
  );
}
