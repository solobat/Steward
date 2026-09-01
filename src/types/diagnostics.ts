export type DiagnosticLevel = "info" | "warn" | "error";
export type DiagnosticArea = "config" | "query" | "command" | "workflow";

export interface DiagnosticEvent {
  id: string;
  timestamp: number;
  level: DiagnosticLevel;
  area: DiagnosticArea;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface DiagnosticEventInput {
  level: DiagnosticLevel;
  area: DiagnosticArea;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}
