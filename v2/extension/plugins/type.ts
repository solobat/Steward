import { JSONSchema4, JSONSchema4Type } from 'json-schema';

import { PluginCommand, StewardApp } from 'common/type';
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

export interface Action {
  title: string;
  actionType: string;
  desc?: string;
  extend?: {
    template?: string;
    protected?: boolean;
  };
  enable: boolean;
}

export interface TextAliasType {
  items: any;
  resolveItems(text: any): any;
  getItems(): Promise<any>;
  onInput(query: any): Promise<ResultItem[]> | ResultItem[];
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
  optionsSchema?: JSONSchema4
  defaultOptions?: JSONSchema4Type
  options?: JSONSchema4Type
  dataEditor?: DataEditor
}

export interface PluginFactory {
  (Steward: StewardApp, options?: {[prop: string]: any}): Plugin;
  displayName?: string;
}

export abstract class PluginClass {
  errors: any[];
  commands: any[];
  _id: string;
  valid: boolean;
  uid?: string;
  version?: string;
  name: string;
  category?: string;
  icon?: string;
  title?: string;
  source?: string;
  author?: string
}

export abstract class WebsiteClass {
  name: string;
  type: string;
  icon: string;
  host: string;
  parentWindow: any;
  navs: string;
  outlineScope: string;
  paths: any[];
  customPaths: any[];
  anchors: any[];
  anchorsConfig: any[];
  isDefault: boolean;
  meta: any[];
  urls: any[];
  outline: any[];
  iframes: any[];
  pageMeta: any;
  shareUrls: any[];
  config: any;
  actions: any[];
}

export interface DataEditor {
  schema: JSONSchema4;
  getData: () => any;
  saveData: (data: any) => void;
}