import type { Command, ResultItem } from "../types";
import { request } from "@/lib/portBridge";

/** AI 助手：ai <问题>（OpenAI 兼容接口，选项页 General 配置），Enter 复制完整回复 */
export const ai: Command = {
  id: "ai",
  key: "ai",
  title: "AI Assistant",
  desc: "Ask AI (configure in Settings)",
  getResultFromFilter(filter: string): ResultItem[] | Promise<ResultItem[]> {
    const raw = filter.trim();
    if (!raw) {
      return [
        {
          id: "ai-none",
          title: "Ask anything",
          desc: "e.g. ai 用一句话介绍 Tailwind CSS",
          disabled: true,
          disabledReason: "Empty input",
        },
      ];
    }
    return request<{ ok: boolean; text?: string; error?: string }>({
      action: "chatComplete",
      data: raw,
    }).then((r) => {
      if (!r || !r.ok || !r.text) {
        return [
          {
            id: "ai-err",
            title: "AI request failed",
            desc: r?.error ?? "Configure API key in Settings → General",
            disabled: true,
            disabledReason: r?.error ?? "Failed",
          },
        ];
      }
      const text = r.text.trim();
      const preview = text.replace(/\s+/g, " ").slice(0, 120);
      return [
        {
          id: "ai-result",
          title: preview || "(empty response)",
          desc: "Enter to copy full reply",
          copyValue: text,
        },
      ];
    });
  },
};
