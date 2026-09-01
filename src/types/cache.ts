export interface CacheBucketStats {
  hits: number;
  misses: number;
}

export interface CacheKeyStats {
  key: string;
  hits: number;
  lastHitAt: number;
}

export interface CacheStatsSnapshot {
  totalHits: number;
  totalMisses: number;
  buckets: Record<string, CacheBucketStats | undefined>;
  recentKeys: Record<string, CacheKeyStats | undefined>;
}
