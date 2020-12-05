import { AxiosStatic } from 'axios';
import md5 from 'blueimp-md5';
import constant from 'constant';
import dayjs from 'dayjs';
import { helpers } from 'helper';
import { Website } from 'helper/websites.helper';
import { AppState } from 'main/type';
import { Command, Plugin } from 'plugins/type';
import { Browser } from 'webextension-polyfill-ts';
import { AppConfig } from './config';
import storage from 'utils/storage';
import util from './util';

declare global {
  var EXT_TYPE: string;
  var PLATFORM: string;

  interface Window {
    __Steward__: StewardApp;
    stewardApp: StewardApp;
    stewardCache: StewardCache;
    slogs: string[];
    matchedSite: Website | null;
    parentHost?: string;
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