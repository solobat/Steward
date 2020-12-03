import '../../node_modules/toastr/toastr.scss';

import md5 from 'blueimp-md5';
import $ from 'jquery';
import orderBy from 'lodash.orderby';
import Toast from 'toastr';
import _ from 'underscore';
import { browser } from 'webextension-polyfill-ts';

import storage from 'common/storage';
import util from 'common/util';
import defaultGeneral from 'conf/general';
import CONST from 'constant';
import { TextAlias, TextAliasType } from 'helper/alias.helper';
import { getComponentsConfig } from 'helper/component.helper';
import { getCustomPlugins } from 'helper/plugin.helper';

import { helpers } from '../helper';
import { getPlugins } from '../plugins';
import * as recordsController from '../server/controller/recordsController';
import { AppData, PluginCommand, StewardApp, StewardCache } from 'common/type';
import { KeyStatus, Plugin, ResultItem, SearchOnInputFunc } from 'plugins/type';
import { AppConfig, PluginsData } from 'common/config';
import { Website } from 'helper/websites.helper';
import { AppState, CommandResultItem } from './type';
import Axios from 'axios';
import PromisifyStorage from 'utils/storage';
import dayjs from 'dayjs';
import { fixNumber, fixNumbers, parseWorkflow } from 'helper/workflow.helper';

const commands: {
  [prop: string]: PluginCommand;
} = {};
const regExpCommands: PluginCommand[] = [];
const otherCommands: PluginCommand[] = [];
const searchContexts: (Website | Plugin)[] = [];
let allPlugins: Plugin[] = [];
let alwaysCommand = null;
let plugin4empty: Plugin;
let randomPlugin: Plugin;
let keys;
let reg;
let mode: string;
let inContent: boolean;
let state: AppState = {
  background: false,
  key: '',
  stage: '',
  str: '',
  cmd: '',
  query: '',
  delay: 0,
  lastcmd: '',
  command: null,
  workflowStack: [],
  keyStatus: {
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
  },
};
window.stewardCache = {} as StewardCache;
window.slogs = [];

window.Steward = window.stewardApp = {
  chrome: window.chrome,
  browser,
  Toast,
  md5,
  axios: Axios,
  dayjs: dayjs,
  $,
  storage: PromisifyStorage,

  state,

  helpers,
  util,
  constant: CONST,
} as StewardApp;

function findMatchedPlugins(query: string) {
  const items: CommandResultItem[] = [];
  let key: string;

  for (key in commands) {
    if (query && key.indexOf(query) !== -1) {
      const command = commands[key];

      items.push({
        key: 'plugins',
        id: key,
        icon: command.icon,
        title: `${key}: ${command.title}`,
        desc: command.subtitle || '',
        weight: (command.weight || 0) + 10,
      } as CommandResultItem);
    }
  }

  return Promise.resolve(items);
}

function findRegExpMatched(str: string) {
  return regExpCommands.find(item => {
    return item.regExp && str.match(item.plugin.commands[0].regExp);
  });
}

function setState(attrs: Partial<AppState> = {}) {
  const newState: any = Object.assign({}, state, attrs);

  if (newState.command !== state.command) {
    if (state.command) {
      const onLeave = state.command.plugin.onLeave;

      if (typeof onLeave === 'function') {
        onLeave({ ...newState }, { ...state });
      }
    }

    if (newState.command) {
      const plugin = newState.command.plugin;
      const onInit = newState.command.plugin.onInit;

      if (typeof onInit === 'function') {
        if (!plugin.inited) {
          onInit({ ...newState });
          plugin.inited = true;
        }
      }
    }
  }

  Object.assign(state, newState);
}

function callCommand(command: PluginCommand | undefined, key: string) {
  if (!command) {
    return;
  }

  if (command.type !== CONST.BASE.PLUGIN_TYPE.ALWAYS) {
    setState({ cmd: command.key, command });
  }

  try {
    return Promise.resolve(command.plugin.onInput(key, command, inContent));
  } catch (error) {
    console.error(error);
    return Promise.resolve();
  }
}

function searchInContext(query: string) {
  const res: ResultItem[] = [];
  const tasks: Promise<any>[] = [];
  let contexts: (TextAliasType | Plugin | Website)[] = [TextAlias];

  if (inContent) {
    contexts = contexts.concat(_.sortBy(searchContexts, 'host'));
  } else {
    contexts = contexts.concat(searchContexts);
  }

  contexts.forEach(context => {
    try {
      const searchRet = (context.onInput as SearchOnInputFunc)(query);

      if (searchRet && searchRet instanceof Promise) {
        tasks.push(searchRet);
      } else if (searchRet && Array.isArray(searchRet)) {
        res.concat(searchRet);
      }
    } catch (error) {
      console.error(error);
    }
  });

  if (tasks.length) {
    return Promise.all(tasks).then(resp => {
      return _.flatten(
        resp.filter(item => item && item.length),
      ) as ResultItem[];
    });
  } else {
    return Promise.resolve(res);
  }
}

function resetBox(lastKey: string, lastCommand: PluginCommand) {
  setState({
    cmd: lastKey,
    command: lastCommand,
  });

  return Promise.resolve();
}

function alwaysStage() {
  const str = state.str;
  const lastCommand = state.command;
  const lastKey = state.key;

  setState({ stage: 'always' });

  if (alwaysCommand) {
    return callCommand(alwaysCommand, str).then(results => {
      if (results) {
        window.Steward.app.emit('app:log', { key: 'calc', str });
        return Promise.reject(results);
      } else {
        return resetBox(lastKey, lastCommand);
      }
    });
  } else {
    return Promise.resolve();
  }
}

function regexpStage() {
  const str = state.str;
  const spCommand = findRegExpMatched(str);

  setState({ stage: 'regexp' });

  // handle regexp commands
  if (spCommand) {
    window.Steward.app.emit('app:log', { key: 'regexp', str });
    return Promise.reject(callCommand(spCommand, str));
  } else {
    return Promise.resolve();
  }
}

function searchStage(): Promise<any> {
  const str = state.str;

  setState({ stage: 'search' });

  // match commands && search in contexts
  if (str.indexOf(' ') === -1) {
    const searched = searchInContext(str);
    const matchedPlugins = findMatchedPlugins(str);

    return Promise.all([matchedPlugins, searched]).then(res => {
      const items = _.flatten(res.filter(item => item && item.length));
      const searchRes = items;

      if (searchRes && searchRes.length) {
        window.Steward.app.emit('app:log', { key: 'search', str });
        setState({
          command: null,
        });

        return Promise.reject(searchRes);
      } else {
        return Promise.resolve(true);
      }
    });
  } else {
    return Promise.resolve();
  }
}

function commandStage(gothrough: boolean) {
  if (gothrough) {
    return Promise.resolve(state);
  }

  setState({ stage: 'command' });

  const str = state.str;
  const mArr = str.match(reg) || [];
  const cmd = mArr[1];
  const key = mArr[2];

  // search in context && handle other commands
  if (cmd) {
    setState({
      cmd,
      query: key,
    });

    try {
      storage.h5.set(CONST.STORAGE.LAST_CMD, str);
    } catch (error) {}

    if (state.lastcmd !== state.cmd) {
      setState({
        lastcmd: state.cmd,
      });
    }

    const command = commands[state.cmd];

    window.Steward.app.emit('app:log', { key: cmd, str });

    return Promise.reject(callCommand(command, key));
  } else {
    return Promise.resolve(state);
  }
}

function defaultStage() {
  if (otherCommands.length) {
    setState({ stage: 'default' });

    window.Steward.app.emit('app:log', { key: 'other', str: state.str });
    return callCommand(otherCommands[0], state.str);
  }
}

function handleEnterResult(
  result: Promise<string | boolean> | void,
): Promise<void> | void {
  const delay4close = 1000;

  if (result && result instanceof Promise) {
    return result
      .then(data => {
        if (typeof data === 'string') {
          window.Steward.app.emit('cmdbox:refresh', data);
        } else {
          const isRetain = data === true;

          if (!isRetain) {
            const delay = typeof data === 'number' ? data : delay4close;

            setTimeout(() => {
              window.Steward.app.emit('shouldCloseBox');
            }, delay);
          }
        }
      })
      .catch(() => {});
  } else {
    window.Steward.app.emit('shouldCloseBox');
  }
}

export function queryByInput(str, background) {
  setState({
    str,
    cmd: '',
    query: '',
  });

  if (background) {
    setState({ background: true });
  }

  return alwaysStage()
    .then(regexpStage)
    .then(searchStage)
    .then(commandStage)
    .then(defaultStage)
    .then(data => Promise.reject(data))
    .catch(msg => {
      if (msg) {
        return Promise.resolve(msg)
          .then(sortResults)
          .then(result => {
            return {
              query: str,
              data: result,
            };
          });
      }
    });
}

async function sortResults(results) {
  const { stage, str } = state;
  if (stage === 'search' || stage === 'command') {
    try {
      const records = await recordsController.query({
        scope: stage === 'search' ? 'search' : state.command.orkey,
        query: stage === 'search' ? str : state.query,
      });
      const items = results.map(result => {
        const record = records.find(item => item.result === result.title);
        if (record) {
          result.times = record.times;
        } else {
          result.times = 0;
        }
        return result;
      });

      return orderBy(items, ['times', 'weight'], ['desc', 'desc']);
    } catch (error) {
      return results;
    }
  } else {
    return results;
  }
}

export function getInitCmd() {
  const config = window.stewardCache.config;
  const { cacheLastCmd, defaultPlugin, customCmd } = config.general;
  const paramCmd = util.getParameterByName('cmd');

  if (util.shouldSupportMe()) {
    return Promise.resolve(Number(new Date()) % 2 ? 'about ' : 'up ');
  } else if (paramCmd) {
    return Promise.resolve(paramCmd);
  } else if (cacheLastCmd) {
    try {
      const last: string = storage.h5.get(CONST.STORAGE.LAST_CMD);

      return Promise.resolve(last || 'site ');
    } catch (error) {
      return Promise.resolve('site ');
    }
  } else if (defaultPlugin) {
    if (defaultPlugin === 'Other') {
      if (customCmd) {
        return Promise.resolve(config.general.customCmd);
      }
    } else if (defaultPlugin === 'Random') {
      return randomPlugin.getOneCommand();
    } else {
      const defaultCommand: PluginCommand = Object.values(commands).find(
        (command: any) => command.name === defaultPlugin,
      );

      if (defaultCommand) {
        return Promise.resolve(`${defaultCommand.key}`);
      }
    }
  }
}

function handleNormalItem(
  box: AppState,
  dataList: ResultItem[],
  item: ResultItem,
  keyStatus: KeyStatus,
): Promise<boolean> | void {
  const ITEM_TYPE = CONST.BASE.ITEM_TYPE;
  const type = item.key;

  if (type === ITEM_TYPE.PLUGINS) {
    const key = item.id;

    window.Steward.app.applyCommand(`${key} `);
    return Promise.resolve(true);
  } else if (type === ITEM_TYPE.URL) {
    if (state.command && state.command.shiftKey) {
      util.batchExecutionIfNeeded(
        keyStatus.shiftKey,
        util.tabCreateExecs,
        [dataList, item],
        keyStatus,
      );
    } else {
      util.createTab(item, keyStatus);
    }
  } else if (type === ITEM_TYPE.COPY) {
    util.copyToClipboard(item.url || item.desc || item.title, true);

    return Promise.resolve(true);
  } else if (type === ITEM_TYPE.ACTION) {
    window.Steward.app.emit('action', {
      action: 'command',
      info: item,
    });
  } else if (type === ITEM_TYPE.APP) {
    window.Steward.app.emit('app:handle', item);
  }

  if (type !== ITEM_TYPE.PLUGINS) {
    window.Steward.app.emit('shouldCloseBox');
  }
}

function execCommand(
  dataList: ResultItem[] = [],
  item: ResultItem[] | ResultItem | false,
  fromWorkflow: boolean,
  keyStatus?: KeyStatus,
): Promise<void> | void {
  if (item) {
    let plugin: Plugin;
    const command = state.command;

    if (state.command) {
      plugin = state.command.plugin;
    } else if (plugin4empty) {
      plugin = plugin4empty;
    }

    if (!Array.isArray(item)) {
      if (item.isDefault && !state.query) {
        return;
      } else if (!state.cmd || item.universal) {
        const result = handleNormalItem(state, dataList, item, keyStatus);
        const ret = handleEnterResult(result);

        window.Steward.app.emit(
          'afterExecCommand',
          item,
          dataList,
          state.query,
        );

        return ret;
      } else if (item.key === 'workflow') {
        if (state.workflowStack.indexOf(item.wid) === -1) {
          return execWorkflow(item).then(() => {
            state.command = command;
            state.background = false;

            try {
              return plugin.onEnter(
                item,
                command,
                state.query,
                state.keyStatus,
                dataList,
              );
            } catch (error) {
              console.log(error);
              return;
            }
          });
        } else {
          console.log('Avoid recursive execution of the same workflow');
          return;
        }
      }
    }

    let partial: ResultItem | ResultItem[] = item;

    if (state.command && !state.command.allowBatch && Array.isArray(item)) {
      partial = item[0];
    }

    try {
      const result = plugin.onEnter(
        partial,
        state.command,
        state.query,
        state.keyStatus,
        dataList,
      );

      if (!fromWorkflow) {
        const enterResult = handleEnterResult(result);

        return enterResult;
      } else {
        return result;
      }
    } catch (error) {
      console.log(error);

      return;
    }
  } else {
    return;
  }
}

export function handleEnter(
  dataList: ResultItem[],
  index: number,
  keyStatus: KeyStatus,
) {
  setState({
    workflowStack: [],
    keyStatus,
  });

  try {
    record(dataList[index], state, mode);
  } catch (error) {
    console.log(error);
  }
  execCommand(dataList, dataList[index], false, keyStatus);
}

function record(item: ResultItem, state: AppState, mode) {
  const { title } = item;
  const { stage } = state;

  if (stage === 'search') {
    return recordsController.log({
      query: state.str,
      scope: stage,
      result: title,
      mode,
    });
  } else if (stage === 'command') {
    return recordsController.log({
      query: state.query,
      scope: state.command.orkey,
      result: title,
      mode
    });
  }
}

const NUM_ALL = -1;
function execWorkflow(item: ResultItem) {
  if (item.content) {
    state.workflowStack.push(item.wid);
    window.slogs = [`Workflow ${item.title}`];

    const cmds = parseWorkflow(item.content);
    const fromWorkflow = true;
    let task = Promise.resolve();

    cmds.forEach(cmd => {
      task = task
        .then(() => {
          return queryByInput(cmd.input, true);
        })
        .then(resp => {
          const { numbers } = cmd;
          const data = resp.data;

          setState({
            keyStatus: {
              shiftKey: cmd.withShift,
            },
          });

          if (data && data.length) {
            if (numbers === NUM_ALL) {
              return execCommand(data, data, fromWorkflow);
            } else if (numbers instanceof Array) {
              const [from, to] = fixNumbers(numbers);

              return execCommand(data, data.slice(from, to + 1), fromWorkflow);
            } else {
              return execCommand(data, data[fixNumber(numbers)], fromWorkflow);
            }
          } else {
            return execCommand(data, false, fromWorkflow);
          }
        });
    });

    return task.then(() => {
      Toast.success(window.slogs.join('<br>'));
      window.slogs = [];
    });
  } else {
    return Promise.reject();
  }
}

export function handleEmpty() {
  if (plugin4empty) {
    setState({
      cmd: CONST.BASE.EMPTY_COMMAND,
      command: null,
      searchTimer: window.setTimeout(() => {
        plugin4empty.onBoxEmpty();
      }, state.delay),
    });
  } else {
    setState({
      command: null,
    });
  }
}

function init() {
  window.addEventListener('storage', function(event) {
    const command = state.command;

    if (command) {
      const onStorageChange = command.plugin.onStorageChange;

      if (onStorageChange) {
        onStorageChange(event, command);
      }
    }
  });
}

function classifyPlugins(pluginsData: PluginsData) {
  const PLUGIN_TYPE = CONST.BASE.PLUGIN_TYPE;

  function isEnabled(plugin: Plugin) {
    const pname = plugin.name;

    if (pluginsData[pname] && pluginsData[pname].disabled) {
      return false;
    } else {
      return true;
    }
  }

  allPlugins.forEach(plugin => {
    if (!plugin.invalid && isEnabled(plugin)) {
      if (typeof plugin.onBoxEmpty === 'function') {
        plugin4empty = plugin;
      }

      if (plugin.name === 'Random Commands') {
        randomPlugin = plugin;
      }

      if (plugin.commands instanceof Array) {
        const pname = plugin.name;
        const pcmds = pluginsData[pname] ? pluginsData[pname].commands : [];

        // commands in cache is simple version
        const realCommands = pcmds.length
          ? $.extend(true, plugin.commands, pcmds)
          : plugin.commands;

        realCommands.forEach(command => {
          if (!command.mode || (command.mode && command.mode === mode)) {
            const cmd: PluginCommand = {
              ...command,
              name: pname,
              plugin,
            };

            switch (command.type) {
              case PLUGIN_TYPE.ALWAYS:
                alwaysCommand = cmd;
                break;
              case PLUGIN_TYPE.REGEXP:
                regExpCommands.push(cmd);
                break;
              case PLUGIN_TYPE.OTHER:
                otherCommands.push(cmd);
                break;
              case PLUGIN_TYPE.KEYWORD:
                commands[command.key] = cmd;
                break;
              default:
                // bugfix
                commands[command.key] = cmd;
                break;
            }
          } else {
            console.log('not avaiable command: ', command);
          }
        });
      } else {
        searchContexts.push(plugin);
      }
    }
  });
}

function initWebsites() {
  if (inContent) {
    const site: Website | null = window.matchedSite;

    if (site) {
      if (!site.isDefault) {
        searchContexts.push(site);
      } else {
        searchContexts.push(site);
      }
    }
  }
}

function restoreConfig(): Promise<{ config: AppConfig }> {
  return new Promise(resolve => {
    chrome.storage.sync.get(CONST.STORAGE.CONFIG, function(res) {
      resolve(res as { config: AppConfig });
    });
  });
}

export function getRandomPlugin() {
  return randomPlugin;
}

export function initConfig(themode: string, isInContent: boolean) {
  inContent = isInContent;
  mode = themode;
  window.stewardCache.inContent = isInContent;
  window.stewardCache.mode = mode;

  return Promise.all([
    restoreConfig(),
    getCustomPlugins(),
    getComponentsConfig(),
  ]).then(([res, customPlugins, components]) => {
    allPlugins = getPlugins(window.Steward).concat(customPlugins);
    classifyPlugins(res.config.plugins);
    initWebsites();

    keys = Object.keys(commands).join('|');
    reg = new RegExp(`^((?:${keys}))\\s(.*)$`, 'i');

    window.stewardCache.commands = commands;
    window.stewardCache.config = res.config || {};

    if (!window.stewardCache.config.general) {
      window.stewardCache.config.general = defaultGeneral;
    }
    window.stewardCache.config.components = components;

    init();

    return window.stewardCache.config;
  });
}

export function globalApi(appData: AppData) {
  window.Steward.mode = appData.mode;
  window.Steward.inContent = appData.inContent;
  window.Steward.config = appData.config;
  window.Steward.data = appData.data;
}

export function installApp(app) {
  window.Steward.app = window.stewardApp.app = {
    on(eventName, fn) {
      app.$on(eventName, fn);

      return this;
    },
    emit(eventName: string, ...params) {
      app.$emit(eventName, ...params);

      return this;
    },

    applyCommand(cmd) {
      app.$emit('apply:command', cmd);
    },

    refresh() {
      app.$emit('apply:command', state.str);
    },

    updateList(list) {
      app.$emit('cmdbox:list', list);
    },

    updateListForCommand(orkey, list) {
      if (state.command && state.command.orkey === orkey) {
        app.$emit('cmdbox:list', list);
      } else {
        console.log('command has changed...');
      }
    },

    clearQuery() {
      this.applyCommand(`${state.cmd} `);
    },

    notice(...args) {
      const command = state.command;

      if (command && command.plugin && command.plugin.onNotice) {
        const eventName = args[0];
        const params = args.slice(1);

        command.plugin.onNotice(eventName, ...params);
      }
    },

    getCurrentCommand() {
      return state.command;
    },
  };

  const evt = new CustomEvent('stewardReady', {
    detail: {
      app: window.Steward,
    },
  });

  document.dispatchEvent(evt);
}

export function clearToasts() {
  Toast.clear();
}
