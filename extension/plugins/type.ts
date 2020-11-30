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
    | ResultItem[];
}

export interface SearchOnInputFunc {
  (query: string): Promise<any> | ResultItem[];
}

export interface Plugin {
  readonly name: string;
  version: number;
  category: string;
  icon: string;
  title: string;
  commands?: Command[];
  canDisabled?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  extName?: string;
  onInput: BaseOnInputFunc | SearchOnInputFunc;
  onEnter: (
    item: ResultItem,
    command: Command,
    query: string,
    keyStatus: KeyStatus,
    list: ResultItem[],
  ) => any;
  setup?: (ext?: any) => void;
  onBoxEmpty?: () => void;
  onLeave?: () => void;
  onStorageChange?: (event: StorageEvent) => void;
  onNotice?: (eventName: string, ...params: any[]) => void;
  getOneCommand?: () => Promise<any>;
}
