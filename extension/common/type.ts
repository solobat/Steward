import md5 from 'blueimp-md5';
import constant from 'constant';
import { helpers } from 'helper';
import { Browser } from 'webextension-polyfill-ts';
import util from './util';

declare global {
  interface Window {
    Steward: StewardApp;
    stewardApp: StewardApp;
    stewardCache: StewardCache;
    slogs: any[];
  }
}

interface Data {
  page: any;
  [prop: string]: any;
}

export interface AppData {
  mode?: string;
  config?: any;
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
} 

export type StewardApp = AppData & {
  helpers: typeof helpers;
  chrome: typeof chrome;
  util: typeof util;
  constant: typeof constant;
  Toast: any;
  md5: typeof md5;
  browser: Browser;
  app?: AppMethods
};

export type StewardCache = Partial<AppData> & {
  commands?: any
  wallpaper?: any
  wordcardExtId?: string
}
