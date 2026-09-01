import type { Command, ResultItem } from "../types";
import { request } from "@/lib/portBridge";
import { fuzzyRank } from "@/lib/fuzzy";
import { createStateItem } from "@/lib/resultState";

type NoteItem = { id: string; text: string; createdAt: number };

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return sameDay ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}

/** 快速笔记：note <内容> 保存；note 列出；note del <词> 删除；note clear 清空 */
export const note: Command = {
  id: "note",
  key: "note",
  title: "Notes",
  desc: "Quick notes: type to save, Enter copies",
  getResultFromFilter(filter: string): ResultItem[] | Promise<ResultItem[]> {
    const raw = filter.trim();

    // 删除 / 清空
    if (/^del\s+/i.test(raw)) {
      const kw = raw.replace(/^del\s+/i, "").trim();
      return request<{ deleted: number }>({ action: "deleteNotesByText", data: kw }).then(
        (r) =>
          r && r.deleted > 0
            ? [createStateItem("empty", { title: `Deleted ${r.deleted} note(s)` })]
            : [createStateItem("empty", { title: "No matching notes" })]
      );
    }
    if (/^clear$/i.test(raw)) {
      return request<{ ok: boolean }>({ action: "clearNotes" }).then(() => [
        createStateItem("empty", { title: "All notes cleared" }),
      ]);
    }

    return request<NoteItem[]>({ action: "getNotes" }).then((list) => {
      const arr = Array.isArray(list) ? list : [];
      const items: ResultItem[] = [];
      // 有输入时：第一项为「新建笔记」
      if (raw) {
        items.push({
          id: "note-new",
          title: `+ New note: ${raw.slice(0, 60)}`,
          desc: "Enter to save",
          runAction: "addNote",
          runPayload: raw,
        });
      }
      const f = raw.toLowerCase();
      const filtered = f ? fuzzyRank(arr, f, (n) => n.text) : arr;
      for (const n of filtered) {
        const lines = n.text.split("\n");
        items.push({
          id: `note-${n.id}`,
          title: (lines[0] || "").slice(0, 60) || "(empty)",
          desc: `${lines.length > 1 ? lines[1].slice(0, 60) : n.text.slice(0, 60)} · ${formatTime(n.createdAt)}`,
          copyValue: n.text,
        });
      }
      if (!raw && !items.length) {
        return [createStateItem("empty", { title: "No notes yet", desc: "Type note text and press Enter to save" })];
      }
      return items;
    });
  },
};
