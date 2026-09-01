import type { AppConfig } from "@/types/config";
import type { Workflow } from "@/types/workflow";

export interface SettingsBundle {
  version: number;
  exportedAt: number;
  config: AppConfig;
  workflows: Workflow[];
  urlBlockList: unknown[];
  urlBlockReplaceList: string[];
}
