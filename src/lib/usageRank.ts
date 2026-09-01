import type { ResultItem } from "@/commands";
import type { UsageRecord, UsageSnapshot } from "@/types/usage";

export const USAGE_RECORDS_KEY = "usageRecords";
export const MAX_USAGE_RECORDS = 500;

export function normalizeUsageSnapshot(raw: unknown): UsageSnapshot {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: UsageSnapshot = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const candidate = value as Partial<UsageRecord>;
    if (
      typeof candidate.key === "string" &&
      typeof candidate.score === "number" &&
      typeof candidate.lastUsedAt === "number"
    ) {
      out[key] = {
        key: candidate.key,
        score: candidate.score,
        lastUsedAt: candidate.lastUsedAt,
      };
    }
  }
  return out;
}

export function buildUsageKey(item: ResultItem): string | null {
  if (item.stateType) return null;
  if (item.workflowId) return `workflow:${item.workflowId}`;
  if (item.runAction && item.runPayload != null) return `action:${item.runAction}:${JSON.stringify(item.runPayload)}`;
  if (item.url) return `url:${item.url}`;
  if (item.copyValue) return `copy:${item.copyValue}`;
  return item.id ? `item:${item.id}` : null;
}

function usageScore(record: UsageRecord | undefined): number {
  if (!record) return 0;
  const ageHours = Math.max(0, (Date.now() - record.lastUsedAt) / (1000 * 60 * 60));
  const recencyBoost = Math.max(0, 72 - ageHours) / 72;
  return record.score + recencyBoost;
}

export function sortItemsByUsage(items: ResultItem[], usage: UsageSnapshot): ResultItem[] {
  return items
    .map((item, index) => ({
      item,
      index,
      score:
        usageScore(usage[`command:${item.id}`]) ||
        usageScore(usage[buildUsageKey(item) ?? ""]) ||
        usageScore(usage[`item:${item.id}`]),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}
