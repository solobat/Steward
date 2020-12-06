import { AxiosStatic } from 'axios';
import md5 from 'blueimp-md5';
import dayjs from 'dayjs';
import { Browser } from 'webextension-polyfill-ts';

import constant from 'constant';
import { helpers } from 'helper';
import { Website } from 'helper/websites.helper';
import { AppState } from 'main/type';
import { Command, Plugin } from 'plugins/type';
import storage from 'utils/storage';

import defaultGeneral from 'conf/general';
import util from './util';
import { JSONSchema4Type } from 'json-schema';

declare global {
  var EXT_TYPE: string;
  var PLATFORM: string;

  interface Window {
    __Steward__: StewardApp;
    stewardApp: StewardApp;
    __StewardCache__: StewardCache;
    slogs: string[];
    matchedSite: Website | null;
    parentHost?: string;
    componentHelper: any;
  }

  interface RegExp {
    formatter?: (query: string) => string
  }
}

interface Data {
  page: any;
  [prop: string]: any;
}

export interface AppData {
  mode?: string;
  config?: AppConfig;
  data?: Data;
  inContent?: boolean;
}

export interface AppMethods {
  on: (eventName: string, fn: any) => void;
  emit: (eventName: string, ...parmas: any[]) => void;
  applyCommand: (cmd: string) => void;
  refresh: () => void;
  updateList: (list: any) => void;
  updateListForCommand: (orkey: string, list: any) => void;
  clearQuery: () => void;
  notice: (...params: any[]) => void;
  getCurrentCommand: () => any;
  helpers: typeof helpers
} 

// TODO: it makes the relationship of modules too weired,
// and some strange bugs will come in
export type StewardApp = AppData & {
  readonly chrome: typeof chrome;
  readonly dayjs: typeof dayjs;
  readonly $: JQueryStatic;
  readonly axios: AxiosStatic;
  readonly storage: typeof storage;
  readonly util: typeof util;
  readonly constant: typeof constant;
  readonly Toast: any;
  readonly md5: typeof md5;
  state: AppState;
  readonly browser: Browser;
  // NOTE: only exsit after Steward UI initialized
  //       so it cannot be used in builtin plugins
  app?: AppMethods
};

export interface PluginCommand extends Command {
  name: string;
  plugin: Plugin;
}

export type StewardCache = Omit<Partial<AppData>, 'config'> & {
  commands?: {
    [prop: string]: PluginCommand;
  }
  wallpaper?: {
    loading?: boolean
  }
  wordcardExtId?: string
  config?: Partial<AppConfig> & {
    components?: any
  }
}

export interface WallpaperSource {
  name: string;
  api: (...args: any[]) => any;
  handle: (result: any) => any;
  weight: number;
}

export type PartialPlugin = Pick<
  Plugin,
  'name' | 'version' | 'canDisabled' | 'icon' | 'disabled' | 'optionsSchema' | 'defaultOptions'
> & {
  commands: SimpleCommand[];
  options: JSONSchema4Type
};

export type SimpleCommand = Pick<Command, 'key' | 'orkey'>;

export interface PluginsData {
  [prop: string]: PartialPlugin;
}

export interface AppConfig {
  general: typeof defaultGeneral;
  plugins: PluginsData;
  version: string;
}
