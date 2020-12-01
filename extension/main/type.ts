import { PluginCommand } from "commmon/type";
import { KeyStatus } from "plugins/type";

export interface AppState {
  background: boolean;
  key: string;
  stage: string;
  str: string;
  cmd: string;
  query: string;
  delay: number;
  lastcmd: string;
  command: PluginCommand | null;
  workflowStack: string[];
  keyStatus: Partial<KeyStatus>;
  searchTimer?: number;
}

export interface CommandResultItem {
  key: string;
  id: string;
  icon: string;
  title: string;
  desc: string;
  weight: number;
}