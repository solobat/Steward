import { useEffect, useMemo, useState } from "react";
import { t } from "@/lib/i18n";
import { request } from "@/lib/portBridge";
import type { CacheStatsSnapshot } from "@/types/cache";
import type { DiagnosticEvent } from "@/types/diagnostics";
import type { SettingsBundle } from "@/types/settingsBundle";

function formatTimestamp(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function getElapsedMs(event: DiagnosticEvent): number | null {
  return typeof event.metadata?.elapsedMs === "number" ? Number(event.metadata.elapsedMs) : null;
}

function topSlowEvents(
  events: DiagnosticEvent[],
  predicate: (event: DiagnosticEvent) => boolean,
  limit = 5
): DiagnosticEvent[] {
  return events
    .filter(predicate)
    .filter((event) => getElapsedMs(event) !== null)
    .sort((a, b) => (getElapsedMs(b) ?? 0) - (getElapsedMs(a) ?? 0))
    .slice(0, limit);
}

function summarizeEvent(event: DiagnosticEvent): string {
  if (event.type === "query_perf_complete") {
    const triggerId = typeof event.metadata?.triggerId === "string" ? event.metadata.triggerId : "main";
    const query = typeof event.metadata?.query === "string" ? event.metadata.query : "";
    return `${triggerId}${query ? ` · ${query}` : ""}`;
  }
  const itemId = typeof event.metadata?.itemId === "string" ? event.metadata.itemId : "";
  const commandId = typeof event.metadata?.commandId === "string" ? event.metadata.commandId : "";
  const action = commandId || itemId || event.type;
  const query = typeof event.metadata?.query === "string" ? event.metadata.query : "";
  return `${action}${query ? ` · ${query}` : ""}`;
}

export default function About() {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStatsSnapshot>({
    totalHits: 0,
    totalMisses: 0,
    buckets: {},
    recentKeys: {},
  });
  const version = useMemo(() => chrome.runtime.getManifest().version, []);
  const [importStatus, setImportStatus] = useState<string>("");
  const perfSummary = useMemo(() => {
    const perfEvents = events.filter((event) => event.type === "query_perf_complete" || event.type.startsWith("command_perf_"));
    const queryPerf = perfEvents.filter((event) => event.type === "query_perf_complete");
    const commandPerf = perfEvents.filter((event) => event.type.startsWith("command_perf_"));
    const avg = (list: DiagnosticEvent[]) => {
      if (!list.length) return null;
      const total = list.reduce((sum, event) => sum + (typeof event.metadata?.elapsedMs === "number" ? Number(event.metadata.elapsedMs) : 0), 0);
      return Math.round(total / list.length);
    };
    return {
      queryCount: queryPerf.length,
      queryAvgMs: avg(queryPerf),
      commandCount: commandPerf.length,
      commandAvgMs: avg(commandPerf),
    };
  }, [events]);
  const slowestQueries = useMemo(
    () => topSlowEvents(events, (event) => event.type === "query_perf_complete"),
    [events]
  );
  const slowestCommands = useMemo(
    () => topSlowEvents(events, (event) => event.type.startsWith("command_perf_")),
    [events]
  );
  const cacheHitRate = useMemo(() => {
    const total = cacheStats.totalHits + cacheStats.totalMisses;
    if (!total) return null;
    return Math.round((cacheStats.totalHits / total) * 100);
  }, [cacheStats]);
  const hotCacheKeys = useMemo(
    () =>
      Object.values(cacheStats.recentKeys)
        .filter((entry): entry is NonNullable<typeof entry> => !!entry)
        .slice(0, 5),
    [cacheStats]
  );
  const cacheBuckets = useMemo(
    () =>
      Object.entries(cacheStats.buckets)
        .filter(([, value]) => !!value)
        .sort((a, b) => {
          const aTotal = (a[1]?.hits ?? 0) + (a[1]?.misses ?? 0);
          const bTotal = (b[1]?.hits ?? 0) + (b[1]?.misses ?? 0);
          return bTotal - aTotal;
        }),
    [cacheStats]
  );

  const loadEvents = () => {
    Promise.all([
      request<DiagnosticEvent[]>({ action: "getDiagnosticEvents" }),
      request<CacheStatsSnapshot>({ action: "getCacheStats" }),
    ])
      .then(([list, stats]) => {
        setEvents(Array.isArray(list) ? list : []);
        setCacheStats(
          stats ?? {
            totalHits: 0,
            totalMisses: 0,
            buckets: {},
            recentKeys: {},
          }
        );
      })
      .catch(() => {
        setEvents([]);
        setCacheStats({
          totalHits: 0,
          totalMisses: 0,
          buckets: {},
          recentKeys: {},
        });
      });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const clearEvents = () => {
    request({ action: "clearDiagnosticEvents" })
      .then(() => setEvents([]))
      .catch(() => {});
  };

  const exportBundle = () => {
    request<SettingsBundle>({ action: "exportSettingsBundle" })
      .then((bundle) => {
        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `steward-settings-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => setImportStatus("Export failed"));
  };

  const importBundle = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SettingsBundle;
      await request({ action: "importSettingsBundle", data: parsed });
      setImportStatus("Import succeeded");
      loadEvents();
    } catch {
      setImportStatus("Import failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="options-section-title">{t("about_title")}</h2>
        <p className="font-mono text-sm text-base-content/80">
          {t("about_version")}: {version}
        </p>
        <p className="text-sm text-base-content/70">{t("about_shortcuts")}</p>
      </div>

      <section className="space-y-3">
        <div className="rounded-lg border border-base-content/10 bg-base-200/40 px-4 py-3">
          <h3 className="font-semibold text-base-content">Backup & Restore</h3>
          <p className="mt-2 text-sm text-base-content/70">
            Export or import config, workflows, and URL block lists as a single JSON bundle.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-sm btn-outline" onClick={exportBundle}>
              Export JSON
            </button>
            <label className="btn btn-sm btn-outline cursor-pointer">
              Import JSON
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  void importBundle(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {importStatus ? <span className="text-sm text-base-content/65">{importStatus}</span> : null}
          </div>
        </div>

        <div className="rounded-lg border border-base-content/10 bg-base-200/40 px-4 py-3">
          <h3 className="font-semibold text-base-content">Performance</h3>
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-base-content/75 sm:grid-cols-2">
            <div>Queries tracked: {perfSummary.queryCount}</div>
            <div>Avg query time: {perfSummary.queryAvgMs ?? "-"} ms</div>
            <div>Commands tracked: {perfSummary.commandCount}</div>
            <div>Avg command time: {perfSummary.commandAvgMs ?? "-"} ms</div>
          </div>
        </div>

        <div className="rounded-lg border border-base-content/10 bg-base-200/40 px-4 py-3">
          <h3 className="font-semibold text-base-content">Cache</h3>
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-base-content/75 sm:grid-cols-3">
            <div>Total hits: {cacheStats.totalHits}</div>
            <div>Total misses: {cacheStats.totalMisses}</div>
            <div>Hit rate: {cacheHitRate ?? "-"}%</div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-base-content/85">Busiest buckets</h4>
              {cacheBuckets.length === 0 ? (
                <p className="mt-2 text-sm text-base-content/60">No cache traffic yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {cacheBuckets.slice(0, 5).map(([bucket, value]) => (
                    <li key={bucket} className="rounded bg-base-100/60 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-base-content/85">{bucket}</span>
                        <span className="font-mono text-base-content/70">
                          {value?.hits ?? 0}H / {value?.misses ?? 0}M
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-base-content/85">Hot cache keys</h4>
              {hotCacheKeys.length === 0 ? (
                <p className="mt-2 text-sm text-base-content/60">No cache hits yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {hotCacheKeys.map((entry) => (
                    <li key={entry.key} className="rounded bg-base-100/60 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-base-content/85">{entry.key}</span>
                        <span className="font-mono text-base-content/70">{entry.hits} hits</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-base-content/10 bg-base-200/40 px-4 py-3">
            <h3 className="font-semibold text-base-content">Slowest Queries</h3>
            {slowestQueries.length === 0 ? (
              <p className="mt-2 text-sm text-base-content/60">No query timing data yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {slowestQueries.map((event) => (
                  <li key={event.id} className="rounded bg-base-100/60 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-base-content/85">{summarizeEvent(event)}</span>
                      <span className="font-mono text-error">{getElapsedMs(event)} ms</span>
                    </div>
                    <div className="mt-1 text-xs text-base-content/55">{formatTimestamp(event.timestamp)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-base-content/10 bg-base-200/40 px-4 py-3">
            <h3 className="font-semibold text-base-content">Slowest Commands</h3>
            {slowestCommands.length === 0 ? (
              <p className="mt-2 text-sm text-base-content/60">No command timing data yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {slowestCommands.map((event) => (
                  <li key={event.id} className="rounded bg-base-100/60 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-base-content/85">{summarizeEvent(event)}</span>
                      <span className="font-mono text-error">{getElapsedMs(event)} ms</span>
                    </div>
                    <div className="mt-1 text-xs text-base-content/55">{formatTimestamp(event.timestamp)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-base-content">Diagnostics</h3>
            <p className="text-sm text-base-content/70">Recent config, query, command, and workflow events.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-sm btn-outline" onClick={loadEvents}>
              Refresh
            </button>
            <button type="button" className="btn btn-sm btn-ghost text-error" onClick={clearEvents}>
              Clear
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-lg border border-base-content/10 bg-base-200/40 px-4 py-3 text-sm text-base-content/60">
            No diagnostic events yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-base-content/10 bg-base-200/40 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="text-base-content/70">{formatTimestamp(event.timestamp)}</span>
                  <span
                    className={`badge badge-sm ${
                      event.level === "error"
                        ? "badge-error"
                        : event.level === "warn"
                          ? "badge-warning"
                          : "badge-info"
                    }`}
                  >
                    {event.level}
                  </span>
                  <span className="badge badge-sm badge-ghost">{event.area}</span>
                  <span className="badge badge-sm badge-ghost">{event.type}</span>
                </div>
                <p className="mt-2 text-sm text-base-content/90">{event.message}</p>
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <pre className="mt-2 overflow-auto rounded bg-base-100/70 p-2 text-xs text-base-content/70">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
