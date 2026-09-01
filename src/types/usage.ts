export interface UsageRecord {
  key: string;
  score: number;
  lastUsedAt: number;
}

export interface UsageSnapshot {
  [key: string]: UsageRecord | undefined;
}

export interface UsageEventInput {
  key: string;
  amount?: number;
}
