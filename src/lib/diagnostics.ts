import type { DiagnosticEvent, DiagnosticEventInput } from "@/types/diagnostics";

export const DIAGNOSTICS_KEY = "diagnosticEvents";
export const MAX_DIAGNOSTIC_EVENTS = 100;

export function createDiagnosticEvent(input: DiagnosticEventInput): DiagnosticEvent {
  return {
    id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    level: input.level,
    area: input.area,
    type: input.type,
    message: input.message,
    metadata: input.metadata,
  };
}

export function normalizeDiagnosticEvents(raw: unknown): DiagnosticEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is DiagnosticEvent => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<DiagnosticEvent>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.timestamp === "number" &&
      typeof candidate.level === "string" &&
      typeof candidate.area === "string" &&
      typeof candidate.type === "string" &&
      typeof candidate.message === "string"
    );
  });
}
