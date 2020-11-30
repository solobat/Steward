import md5 from 'blueimp-md5';
import constant from 'constant';
import { helpers } from 'helper';
import { Browser } from 'webextension-polyfill-ts';
import util from './util';

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

export interface App {
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
  app?: App
};
