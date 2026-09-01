import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { request } from "@/lib/portBridge";
import { applyPresetVars, getPreset } from "@/lib/presets";
import type { AppConfig, AppearanceConfig, AppearanceTheme } from "@/types/config";
import General from "./General";
import Plugins from "./Plugins";
import Search from "./Search";
import Workflows from "./Workflows";
import CustomCommands from "./CustomCommands";
import Appearance from "./Appearance";
import About from "./About";

type TabId = "general" | "plugins" | "search" | "workflows" | "customCommands" | "appearance" | "about";

const TAB_IDS: TabId[] = ["general", "plugins", "search", "workflows", "customCommands", "appearance", "about"];
const TAB_LABEL_KEYS: Record<TabId, string> = {
  general: "tab_general",
  plugins: "tab_plugins",
  search: "tab_search",
  workflows: "tab_workflows",
  customCommands: "tab_custom_commands",
  appearance: "tab_appearance",
  about: "tab_about",
};

function resolveTheme(theme: AppearanceTheme | undefined): "light" | "dark" {
  if (!theme || theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export default function App() {
  const [tab, setTab] = useState<TabId>("general");

  // 让选项页跟随保存的主题（浅色/深色/跟随系统）与设计风格预设，保存后立即生效
  useEffect(() => {
    const apply = (config: Partial<AppConfig> | null | undefined) => {
      const appearance: AppearanceConfig | undefined = config?.appearance;
      const resolved = resolveTheme(appearance?.theme);
      document.documentElement.setAttribute("data-theme", resolved);
      // 预设色板（壁纸/玻璃/文字）
      const preset = getPreset(appearance?.preset);
      applyPresetVars(document.documentElement, preset.id, resolved);
    };
    request<Partial<AppConfig>>({ action: "getConfig" })
      .then(apply)
      .catch(() => apply(null));

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = () => {
      request<Partial<AppConfig>>({ action: "getConfig" }).then((c) => {
        if (!c?.appearance?.theme || c.appearance.theme === "system") apply(c);
      }).catch(() => {});
    };
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "sync" && changes.config) {
        apply(changes.config.newValue as Partial<AppConfig> | undefined);
      }
    };
    chrome.storage.onChanged.addListener(onStorage);
    media.addEventListener("change", onMediaChange);
    return () => {
      chrome.storage.onChanged.removeListener(onStorage);
      media.removeEventListener("change", onMediaChange);
    };
  }, []);

  return (
    <div className="options-page min-h-screen bg-base-300 w-full">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col md:flex-row min-h-screen px-3 sm:px-4 md:px-6 lg:px-8">
        <aside className="options-nav shrink-0 flex flex-row md:flex-col md:w-40 lg:w-44 border-b md:border-b-0 md:border-r border-base-content/10 bg-base-300/90">
          <div className="flex items-center gap-3 md:block py-3 md:py-4 md:px-4 md:border-b border-base-content/10">
            <h1 className="font-mono text-sm font-semibold tracking-widest text-base-content/90 uppercase whitespace-nowrap">
              Steward
            </h1>
            <div className="hidden md:block mt-1 h-px w-8 bg-primary/60 rounded-full" aria-hidden />
          </div>
          <nav className="flex md:flex-col flex-1 md:flex-none overflow-x-auto md:overflow-visible gap-0.5 md:gap-0 py-2 md:py-2 md:px-2 min-w-0" role="tablist">
            {TAB_IDS.map((tabId) => (
              <button
                key={tabId}
                role="tab"
                aria-selected={tab === tabId}
                className={`options-nav-item shrink-0 md:w-full text-center md:text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  tab === tabId
                    ? "bg-primary/10 text-primary border-b-2 md:border-b-0 md:border-l-2 border-primary md:-ml-px md:pl-[11px]"
                    : "text-base-content/70 hover:bg-base-content/5 hover:text-base-content"
                }`}
                onClick={() => setTab(tabId)}
              >
                {t(TAB_LABEL_KEYS[tabId])}
              </button>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0 min-h-0 py-4 md:py-6 pl-0 md:pl-6 pr-0 md:pr-2 lg:pl-8 lg:pr-4 overflow-auto">
          <div className="options-panel rounded-xl border border-base-content/10 border-t-primary/30 bg-base-100 shadow-sm">
            <div className="card-body p-4 sm:p-6 lg:p-8">
              {tab === "general" && <General />}
              {tab === "plugins" && <Plugins />}
              {tab === "search" && <Search />}
              {tab === "workflows" && <Workflows />}
              {tab === "customCommands" && <CustomCommands />}
              {tab === "appearance" && <Appearance />}
              {tab === "about" && <About />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
