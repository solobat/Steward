import type { Command, ResultItem } from "../types";
import { request } from "@/lib/portBridge";

const TARGET_LANGS = ["zh", "en", "ja", "ko", "fr", "de", "es", "ru", "pt", "it"];

const LANG_NAMES: Record<string, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  ru: "Русский",
  pt: "Português",
  it: "Italiano",
};

type TranslateResult = { text: string; from: string; to: string };

/** 翻译：tr <文本>（自动目标语言）或 tr <语言> <文本>，Enter 复制译文 */
export const tr: Command = {
  id: "tr",
  key: "tr",
  title: "Translate",
  desc: "Translate text",
  getResultFromFilter(filter: string): ResultItem[] | Promise<ResultItem[]> {
    const raw = filter.trim();
    if (!raw) {
      return [
        {
          id: "tr-none",
          title: "Enter text to translate",
          desc: "e.g. tr 你好 · tr en 你好",
          disabled: true,
          disabledReason: "Empty input",
        },
      ];
    }
    // 可选显式目标语言：tr zh <文本>
    let target = "";
    let text = raw;
    const m = raw.match(/^(zh|en|ja|ko|fr|de|es|ru|pt|it)\s+(.+)$/i);
    if (m && TARGET_LANGS.includes(m[1].toLowerCase())) {
      target = m[1].toLowerCase();
      text = m[2].trim();
    }
    if (!text) {
      return [
        {
          id: "tr-none",
          title: "Enter text to translate",
          desc: "e.g. tr 你好 · tr en 你好",
          disabled: true,
          disabledReason: "Empty input",
        },
      ];
    }
    return request<TranslateResult | null>({ action: "translate", data: { text, target } })
      .then((r) => {
        if (!r || !r.text) {
          return [
            {
              id: "tr-err",
              title: "Translate failed",
              desc: "Check your network and try again",
              disabled: true,
              disabledReason: "Request failed",
            },
          ];
        }
        return [
          {
            id: "tr-result",
            title: r.text.slice(0, 200),
            desc: `${LANG_NAMES[r.from] ?? r.from} → ${LANG_NAMES[r.to] ?? r.to.toUpperCase()}`,
            copyValue: r.text,
          },
        ];
      });
  },
};
