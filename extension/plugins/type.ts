
export interface Plugin {
  readonly name: string;
  version: number;
  category: string;
  icon: string;
  title: string;
  commands?: any;
  onInput: (query: any, command: any, inContent: any) => any;
  onEnter: (item: any, command: any, query: any, keyStatus: any, list: any) => any;
  canDisabled?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  setup?: (ext?: any) => void;
  extName?: string;
}