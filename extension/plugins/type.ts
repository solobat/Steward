export type Type = 'keyword' | 'search' | 'always' | 'regexp' | 'other';

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
}

export interface Plugin {
  readonly name: string;
  version: number;
  category: string;
  icon: string;
  title: string;
  commands?: Command[];
  onInput: (query: any, command: any, inContent: any) => any;
  onEnter: (
    item: any,
    command: any,
    query: any,
    keyStatus: any,
    list: any,
  ) => any;
  canDisabled?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  setup?: (ext?: any) => void;
  extName?: string;
}
