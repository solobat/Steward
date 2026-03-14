/**
 * 命令注册表：汇总所有命令，供 CmdBox / background / content 使用
 * 新增命令：1) 在 commands/ 下新建目录 xxx/，至少 index.ts；2) 此处 import 并加入 TRIGGERS
 */
import type { Command } from "./types";
import { meta } from "./meta";
import { nav } from "./nav";
import { outline } from "./outline";
import { his } from "./his";
import { bm } from "./bm";
import { wf } from "./wf";
import { settings } from "./settings";
import { close } from "./close";
import { tab } from "./tab";
import { tabc } from "./tabc";
import { tabm } from "./tabm";
import { tabp } from "./tabp";
import { mute } from "./mute";
import { on } from "./on";
import { off } from "./off";
import { set } from "./set";
import { del } from "./del";
import { extensions } from "./extensions";
import { download } from "./download";
import { topsites } from "./topsites";
import { calculate } from "./calculate";
import { openurl } from "./openurl";
import { search } from "./search";
import { bk } from "./bk";
import { bk8 } from "./bk8";
import { bkseturl } from "./bkseturl";

export type { Command, DataMode, ActionType, ResultItem, LoadContext, ExecuteContext } from "./types";

export const TRIGGERS: Command[] = [
  meta,
  nav,
  outline,
  his,
  bm,
  wf,
  settings,
  close,
  tab,
  tabc,
  tabm,
  tabp,
  mute,
  on,
  off,
  set,
  del,
  extensions,
  download,
  topsites,
  calculate,
  openurl,
  search,
  bk,
  bk8,
  bkseturl,
];
