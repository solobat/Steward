/**
 * @file script for new tab page
 * @author tomasy
 * @email solopea@gmail.com
 */
/*global stewardCache*/

import $ from 'jquery'
import util from '../common/util'
import storage from '../common/storage'
import CONST from '../constant'
import {plugins} from '../plugins'
import { getCustomPlugins } from '../helper/pluginHelper'
import _ from 'underscore'
import defaultGeneral from '../../js/conf/general'
import Toast from 'toastr'
import TextAlias from '../helper/aliasHelper'

const commands = {};
const regExpCommands = [];
const otherCommands = [];
const searchContexts = [];
let allPlugins = [];
let alwaysCommand = null;
let plugin4empty;
let randomPlugin;
let keys;
let reg;
let mode;
let inContent;
let state = {
    str: '',
    cmd: '',
    query: '',
    lastcmd: '',
    command: null,
    workflowStack: [],
    keyStatus: {
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false
    }
};

window.stewardCache = {};
window.slogs = [];

function findMatchedPlugins(query) {
    const items = [];
    let key;

    for (key in commands) {
        if (query && key.indexOf(query) !== -1) {
            const command = commands[key];

            items.push({
                key: 'plugins',
                id: key,
                icon: command.icon,
                title: `${key}: ${command.title}`,
                desc: command.subtitle || '',
                weight: (command.weight || 0) + 10
            });
        }
    }

    return Promise.resolve(items);
}

function findRegExpMatched(str) {
    return regExpCommands.find(item => {
        return item.regExp && str.match(item.plugin.commands[0].regExp);
    });
}

function setState(attrs = {}) {
    const newState = Object.assign({}, state, attrs);

    if (newState.command !== state.command) {
        if (state.command) {
            const onLeave = state.command.plugin.onLeave;

            if (typeof onLeave === 'function') {
                Reflect.apply(onLeave, state, [...newState]);
            }
        }

        if (newState.command) {
            const plugin = newState.command.plugin;
            const onInit = newState.command.plugin.onInit;

            if (typeof onInit === 'function') {
                if (!plugin.inited) {
                    Reflect.apply(onInit, state, [...newState]);
                    plugin.inited = true;
                }
            }
        }
    }

    state = newState;
}

function callCommand(command, key) {
    if (!command) {
        return;
    }

    if (command.type !== CONST.BASE.PLUGIN_TYPE.ALWAYS) {
        setState({ cmd: command.key, command });
    }

    try {
        return Reflect.apply(command.plugin.onInput, state, [key, command, inContent]);
    } catch (error) {
        console.error(error);
        return Promise.resolve();
    }
}

function searchInContext(query) {
    const res = [];
    const tasks = [];
    let contexts = [TextAlias];

    if (inContent) {
        contexts = contexts.concat(_.sortBy(searchContexts, 'host'));
    } else {
        contexts = contexts.concat(searchContexts);
    }

    contexts.forEach(context => {
        try {
            const searchRet = context.onInput(query);

            if (searchRet && (searchRet instanceof Promise || typeof searchRet.then === 'function')) {
                tasks.push(searchRet);
            } else if (searchRet && searchRet.length) {
                res.concat(searchRet);
            }
        } catch (error) {
            console.error(error);
        }
    });

    if (tasks.length) {
        return Promise.all(tasks).then(resp => {
            return _.flatten(resp.filter(item => item && item.length));
        });
    } else {
        return Promise.resolve(res);
    }
}

function resetBox(lastKey, lastCommand) {
    setState({
        cmd: lastKey,
        command: lastCommand
    });

    return Promise.resolve();
}

function alwaysStage() {
    const str = state.str;
    const lastCommand = state.command;
    const lastKey = state.key;

    if (alwaysCommand) {
        return callCommand(alwaysCommand, str).then(results => {
            if (results) {
                window.stewardApp.emit('app:log', { key: 'calc', str });
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

    // handle regexp commands
    if (spCommand) {
        window.stewardApp.emit('app:log', { key: 'regexp', str });
        return Promise.reject(callCommand(spCommand, str));
    } else {
        return Promise.resolve();
    }
}

function searchStage() {
    const str = state.str;

    // match commands && search in contexts
    if (str.indexOf(' ') === -1) {
        const searched = searchInContext(str);
        const matchedPlugins = findMatchedPlugins(str);

        return Promise.all([
            matchedPlugins,
            searched
        ]).then(res => {
            const items = _.flatten(res.filter(item => item && item.length));
            const searchRes = _.sortBy(items, 'weight').reverse();

            if (searchRes && searchRes.length) {
                window.stewardApp.emit('app:log', { key: 'search', str });
                setState({
                    command: null
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

function commandStage(gothrough) {
    if (gothrough) {
        return Promise.resolve(state);
    }

    const str = state.str;
    const mArr = str.match(reg) || [];
    const cmd = mArr[1];
    const key = mArr[2];

    // search in context && handle other commands
    if (cmd) {
        setState({
            cmd,
            query: key
        });

        storage.h5.set(CONST.STORAGE.LAST_CMD, str);

        if (state.lastcmd !== state.cmd) {
            setState({
                lastcmd: state.cmd
            });
        }

        const command = commands[state.cmd];

        window.stewardApp.emit('app:log', { key: cmd, str });

        return Promise.reject(callCommand(command, key));
    } else {
        return Promise.resolve(state);
    }
}

function defaultStage() {
    if (otherCommands.length) {
        window.stewardApp.emit('app:log', { key: 'other', str: state.str });
        return callCommand(otherCommands[0], state.str);
    }
}

function handleEnterResult(result) {
    const delay4close = 1000;

    if (result && result instanceof Promise) {
        return result.then(data => {
            if (typeof data === 'string') {
                window.stewardApp.emit('cmdbox:refresh', data);
            } else {
                const isRetain = data === true;

                if (!isRetain) {
                    const delay = typeof data === 'number' ? data : delay4close;

                    setTimeout(() => {
                        window.stewardApp.emit('shouldCloseBox');
                    }, delay);
                }
            }
        }).catch(() => {});
    } else {
        window.stewardApp.emit('shouldCloseBox');
    }
}

export function queryByInput(str, background) {
    setState({
        str,
        cmd: '',
        query: ''
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
                return Promise.resolve(msg).then(result => {
                    return {
                        query: str,
                        data: result
                    }
                });
            }
        });
}

export function getInitCmd () {
    const config = stewardCache.config;
    const { cacheLastCmd, defaultPlugin, customCmd } = config.general;
    const paramCmd = util.getParameterByName('cmd');

    if (util.shouldSupportMe()) {
        return Promise.resolve(Number(new Date()) % 2 ? 'about ' : 'up ');
    } else if (paramCmd) {
        return Promise.resolve(paramCmd);
    } else if (cacheLastCmd) {
        return Promise.resolve(storage.h5.get(CONST.STORAGE.LAST_CMD) || 'site ');
    } else if (defaultPlugin) {
        if (defaultPlugin === 'Other') {
            if (customCmd) {
                return Promise.resolve(config.general.customCmd);
            }
        } else if (defaultPlugin === 'Random') {
            return randomPlugin.getOneCommand();
        } else {
            const defaultCommand = Object.values(commands).find(command => command.name === defaultPlugin);

            if (defaultCommand) {
                return Promise.resolve(`${defaultCommand.key}`);
            }
        }
    }
}

function handleNormalItem(box, dataList, item, keyStatus) {
    const ITEM_TYPE = CONST.BASE.ITEM_TYPE;
    const type = item.key;

    if (type === ITEM_TYPE.PLUGINS) {
        const key = item.id;

        window.stewardApp.applyCommand(`${key} `);
        return Promise.resolve(true);
    } else if (type === ITEM_TYPE.URL) {
        if (state.command && state.command.shiftKey) {
            util.batchExecutionIfNeeded(keyStatus.shiftKey, util.tabCreateExecs, [dataList, item], keyStatus);
        } else {
            util.createTab(item, keyStatus);
        }
    } else if (type === ITEM_TYPE.COPY) {
        util.copyToClipboard(item.url || item.desc || item.title, true);

        return Promise.resolve(true);
    } else if (type === ITEM_TYPE.ACTION) {
        window.stewardApp.emit('action', {
            action: 'command',
            info: item
        });
    } else if (type === ITEM_TYPE.APP) {
        window.stewardApp.emit('app:handle', item);
    }

    if (type !== ITEM_TYPE.PLUGINS) {
        window.stewardApp.emit('shouldCloseBox');
    }
}

function execCommand(dataList = [], item, fromWorkflow, keyStatus) {
    if (!item) {
        return;
    } else if (item && item.isDefault && !state.query) {
        return;
    } else if (!state.cmd || item.universal) {
        const result = handleNormalItem(state, dataList, item, keyStatus);
        const ret = handleEnterResult(result);

        window.stewardApp.emit('afterExecCommand', item, dataList, state.query);

        return ret;
    } else {
        let plugin;
        const command = state.command;

        if (state.command) {
            plugin = state.command.plugin
        } else if (plugin4empty) {
            plugin = plugin4empty;
        }

        if (item && item.key === 'workflow') {
            if (state.workflowStack.indexOf(item.wid) === -1) {
                return execWorkflow(item).then(() => {
                    state.command = command;
                    state.background = false;

                    try {
                        return Reflect.apply(plugin.onEnter, state, [item, command, state.query, state.keyStatus, dataList]);
                    } catch (error) {
                        console.log(error);
                        return;
                    }
                });
            } else {
                console.log('Avoid recursive execution of the same workflow');
                return;
            }
        } else {
            let partial = item;

            if (state.command && !state.command.allowBatch && item instanceof Array) {
                partial = item[0];
            }

            try {
                const result = Reflect.apply(plugin.onEnter, state, [partial, state.command, state.query, state.keyStatus, dataList]);

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
        }
    }
}

export function handleEnter (dataList, index, keyStatus) {
    setState({
        workflowStack: [],
        keyStatus
    });

    execCommand(dataList, dataList[index], false, keyStatus);
}

// should cache
const numberReg = /(^[\d]+-[\d]+$)|(^[\d]+$)|^all$/;

function parseNumbers(part) {
    const matched = part.match(numberReg)[0];

    if (matched.indexOf('-') !== -1) {
        const sp = matched.split('-');

        return [sp[0], sp[1]].sort();
    } else if (matched === 'all') {
        return -1;
    } else {
        return matched;
    }
}

function resolveTemplate(text = '') {
    const pageData = stewardApp.data.page;

    if (text.indexOf('{{') !== -1 && stewardApp.inContent && pageData) {
        return util.simTemplate(text, pageData);
    } else {
        return text;
    }
}

function parseLine(line) {
    const realLine = line.replace(/^[\s\t]+/, '');
    const parts = realLine.split(/[|,，]/).slice(0, 3);
    let input, numbers, withShift;

    parts.forEach(part => {
        if (part.match(numberReg)) {
            numbers = parseNumbers(part);
        } else if (part.toLowerCase() === 'shift') {
            withShift = true;
        } else {
            input = resolveTemplate(part);
        }
    });

    return {
        input,
        numbers,
        withShift
    };
}

function parseWorkflow(content) {
    return content.split('\n')
        .filter(line => line && !line.match(/^[\s\t]+$/))
        .map(parseLine)
        .filter(cmd => cmd.input);
}

function fixNumbers(numbers) {
    return numbers.map(fixNumber);
}

function fixNumber(number) {
    if (number <= 0 || !number) {
        return 0;
    } else {
        return number - 1;
    }
}

const NUM_ALL = -1;
function execWorkflow(item) {
    if (item.content) {
        state.workflowStack.push(item.wid);
        window.slogs = [`Workflow ${item.title}`];

        const cmds = parseWorkflow(item.content);
        const fromWorkflow = true;
        let task = Promise.resolve();

        cmds.forEach(cmd => {
            task = task.then(() => {
                return queryByInput(cmd.input, true);
            }).then(resp => {
                const { numbers } = cmd;
                const data = resp.data;

                setState({
                    keyStatus: {
                        shiftKey: cmd.withShift
                    }
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
            searchTimer: setTimeout(() => {
                Reflect.apply(plugin4empty.onBoxEmpty, state, []);
            }, state.delay)
        });
    } else {
        setState({
            command: null
        });
    }
}

function init() {
    window.addEventListener('storage', function(event) {
        const command = state.command

        if (command) {
            const onStorageChange = command.plugin.onStorageChange;

            if (onStorageChange) {
                Reflect.apply(onStorageChange, state, [event, command]);
            }
        }
    });
}

function classifyPlugins(pluginsData) {
    const PLUGIN_TYPE = CONST.BASE.PLUGIN_TYPE;

    function isEnabled(plugin) {
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
                const realCommands = pcmds.length ? $.extend(true, plugin.commands, pcmds) : plugin.commands;

                realCommands.forEach(command => {
                    if (!command.mode || (command.mode && command.mode === mode)) {
                        const cmd = {
                            ...command,
                            name: pname,
                            plugin
                        };

                        switch(command.type) {
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
        const site = window.matchedSite;

        if (site) {
            if (!site.isDefault) {
                searchContexts.push(site);
            } else {
                searchContexts.push(site);
            }
        }
    }
}

function restoreConfig() {
    return new Promise(resolve => {
        chrome.storage.sync.get(CONST.STORAGE.CONFIG, function(res) {
            resolve(res);
        });
    });
}

export function getRandomPlugin() {
    return randomPlugin;
}

export function initConfig(themode, isInContent) {
    inContent = isInContent;
    mode = themode;
    stewardCache.inContent = isInContent;
    stewardCache.mode = mode;

    return Promise.all([
        restoreConfig(),
        getCustomPlugins()
    ]).then(([res, customPlugins]) => {
        allPlugins = plugins.concat(customPlugins);
        classifyPlugins(res.config.plugins, inContent);
        initWebsites();

        keys = Object.keys(commands).join('|');
        reg = new RegExp(`^((?:${keys}))\\s(.*)$`, 'i');

        stewardCache.commands = commands;
        stewardCache.config = res.config || {};

        if (!stewardCache.config.general) {
            stewardCache.config.general = defaultGeneral;
        }

        init();

        return stewardCache.config;
    });
}

const stewardApp = window.stewardApp = {};

export function globalData(data) {
    Object.assign(stewardApp, data);
}

export function globalApi(app) {
    Object.assign(stewardApp, {
        on(eventName, fn) {
          app.$on(eventName, fn);

          return this;
        },

        emit(...args) {
          const eventName = args[0];
          const params = args.slice(1);

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
        }
    });

    const evt = new CustomEvent('stewardReady', {
        detail: {
            app: window.stewardApp
        }
    });

    document.dispatchEvent(evt);
}

export function clearToasts() {
    Toast.clear();
}