import { PluginCommand, StewardApp } from 'commmon/type';
import { AppState } from 'main/type';

export type Type = 'keyword' | 'search' | 'always' | 'regexp' | 'other';

export type Mode = 'popup' | 'newtab' | 'content';
export interface Command {
  key: string;
  type: Type;
  title: string;
  subtitle: string;
  icon: string;
  orkey?: string;
  allowBatch?: boolean;
  workflow?: boolean;
  weight?: number;
  shiftKey?: boolean;
  editable?: boolean;
  mode?: Mode;
  regExp?: RegExp;
}

export interface ResultItem {
  id?: string;
  wid?: string;
  key?: string;
  title: string;
  desc?: string;
  icon?: string;
  url?: string;
  isWarn?: boolean;
  content?: string;
  isDefault?: boolean;
  universal?: boolean;
  [prop: string]: any;
}

export interface KeyStatus {
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

export interface BaseOnInputFunc {
  (query: string, command: Command, inContent: boolean):
    | Promise<any>
    | ResultItem[]
    | string;
}

export interface SearchOnInputFunc {
  (query: string): Promise<any> | ResultItem[];
}

export namespace StewardPlugin {
  export type onInput = BaseOnInputFunc | SearchOnInputFunc;
  export type onEnter = (
    item: ResultItem | ResultItem[],
    command: PluginCommand,
    query: string,
    keyStatus: Partial<KeyStatus>,
    list: ResultItem[],
  ) => any;
  export type getOneCommand = () => Promise<string>;
}

export interface Plugin {
  readonly name: string;
  version: number;
  type?: string;
  category: string;
  icon: string;
  title: string;
  commands?: Command[];
  canDisabled?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  extName?: string;
  onInput: StewardPlugin.onInput;
  onEnter: StewardPlugin.onEnter;
  setup?: (ext?: any) => void;
  authenticate?: () => void;
  onBoxEmpty?: () => void;
  onInit?: (state: AppState) => void;
  onLeave?: (newState: AppState, oldState: AppState) => void;
  onStorageChange?: (event: StorageEvent, command: PluginCommand) => void;
  onNotice?: (eventName: string, ...params: any[]) => void;
  getOneCommand?: StewardPlugin.getOneCommand;
  [prop: string]: any;
}

export interface PluginFactory {
  (Steward: StewardApp): Plugin;
}
