import { useEffect, useState } from "react";
import CmdBox, { isInIframe } from "./CmdBox";
import { request } from "@/lib/portBridge";
import type { AppearanceConfig, AppearanceTheme } from "@/types/config";

function resolveTheme(theme: AppearanceTheme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyAppearance(appearance: AppearanceConfig | null) {
  const theme = appearance?.theme ?? "system";
  const fontSize = appearance?.fontSize ?? "medium";
  const primaryColor = (appearance?.primaryColor ?? "").trim();
  const listDensity = appearance?.listDensity ?? "default";
  const cornerRadius = appearance?.cornerRadius ?? "default";

  document.documentElement.setAttribute("data-theme", resolveTheme(theme));
  document.documentElement.classList.remove("steward-fs-small", "steward-fs-medium", "steward-fs-large");
  document.documentElement.classList.add(`steward-fs-${fontSize}`);
  document.documentElement.dataset.density = listDensity;
  document.documentElement.dataset.radius = cornerRadius;

  if (primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    document.documentElement.style.setProperty("--p", primaryColor);
    const r = parseInt(primaryColor.slice(1, 3), 16) / 255;
    const g = parseInt(primaryColor.slice(3, 5), 16) / 255;
    const b = parseInt(primaryColor.slice(5, 7), 16) / 255;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    document.documentElement.style.setProperty("--pc", luma > 0.5 ? "oklch(0.15 0.02 260)" : "oklch(0.99 0 0)");
  } else {
    document.documentElement.style.removeProperty("--p");
    document.documentElement.style.removeProperty("--pc");
  }
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
      request<{ config?: { appearance?: { theme?: AppearanceTheme } } }>({ action: "getData" }).then(
        (data) => {
          const t = data?.config?.appearance?.theme ?? "system";
          if (t === "system") {
            document.documentElement.setAttribute(
              "data-theme",
              media.matches ? "dark" : "light"
            );
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
    <div className={inIframe ? "h-full min-h-screen bg-base-100" : "min-w-[420px]"}>
      <CmdBox appearance={appearance} />
    </div>
  );
}
