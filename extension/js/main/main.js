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
const cmdbox = {
    str: '',
    cmd: '',
    query: '',
    lastcmd: '',
    command: null,
    workflowStack: []
};

window.stewardCache = {};
window.slogs = [];

function findMatchedPlugins(query) {
    const items = [];
    let key;

    for (key in commands) {
        if (query && key.indexOf(query) !== -1) {
            items.push({
                key: 'plugins',
                id: key,
                icon: commands[key].icon,
                title: `${key}: ${commands[key].title}`,
                desc: commands[key].subtitle || ''
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

function callCommand(command, key) {
    if (!command) {
        return;
    }

    cmdbox.cmd = command.key;
    if (cmdbox.command && cmdbox.command !== command) {
        const onLeave = cmdbox.command.plugin.onLeave;

        if (typeof onLeave === 'function') {
            Reflect.apply(onLeave, cmdbox, [key, command, inContent]);
        }
    }
    cmdbox.command = command;

    try {
        return Reflect.apply(command.plugin.onInput, cmdbox, [key, command, inContent]);
    } catch (error) {
        console.error(error);
        return Promise.resolve();
    }
}

function searchInContext(query) {
    const res = [];
    const tasks = [];
    let contexts;

    if (inContent) {
        contexts = _.sortBy(searchContexts, 'host');
    } else {
        contexts = searchContexts;
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

function resetBox() {
    cmdbox.cmd = '';
    cmdbox.command = null;

    return Promise.resolve();
}

function alwaysStage() {
    const str = cmdbox.str;

    if (alwaysCommand) {
        return callCommand(alwaysCommand, str).then(results => {
            if (results) {
                window.stewardApp.emit('app:log', { key: 'calc', str });
                return Promise.reject(results);
            } else {
                return resetBox();
            }
        });
    } else {
        return Promise.resolve();
    }
}

function regexpStage() {
    const str = cmdbox.str;
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
    const str = cmdbox.str;

    // match commands && search in contexts
    if (str.indexOf(' ') === -1) {
        const searched = searchInContext(str);
        const matchedPlugins = findMatchedPlugins(str);

        return Promise.all([
            matchedPlugins,
            searched
        ]).then(res => {
            const searchRes = _.flatten(res.filter(item => item && item.length));

            if (searchRes && searchRes.length) {
                window.stewardApp.emit('app:log', { key: 'search', str });
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
        return Promise.resolve(cmdbox);
    }

    const str = cmdbox.str;
    const mArr = str.match(reg) || [];
    const cmd = mArr[1];
    const key = mArr[2];

    // search in context && handle other commands
    if (cmd) {
        cmdbox.cmd = cmd;
        cmdbox.query = key;

        storage.h5.set(CONST.STORAGE.LAST_CMD, str);

        if (cmdbox.lastcmd !== cmdbox.cmd) {
            cmdbox.lastcmd = cmdbox.cmd;
        }

        const command = commands[cmdbox.cmd];

        window.stewardApp.emit('app:log', { key: cmd, str });

        return Promise.reject(callCommand(command, key));
    } else {
        return Promise.resolve(cmdbox);
    }
}

function defaultStage() {
    if (otherCommands.length) {
        window.stewardApp.emit('app:log', { key: 'other', str: cmdbox.str });
        return callCommand(otherCommands[0], cmdbox.str);
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
    cmdbox.str = str;
    cmdbox.cmd = '';
    cmdbox.query = '';

    if (background) {
        cmdbox.background = true;
    }

    return alwaysStage()
        .then(regexpStage)
        .then(searchStage)
        .then(commandStage)
        .then(defaultStage)
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

    if (util.shouldSupportMe()) {
        return Promise.resolve(Number(new Date()) % 2 ? 'about ' : 'up ');
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

function handleNormalItem(box, dataList, item) {
    const ITEM_TYPE = CONST.BASE.ITEM_TYPE;
    const type = item.key;

    if (type === ITEM_TYPE.PLUGINS) {
        const key = item.id;

        window.stewardApp.applyCommand(`${key} `);
        return Promise.resolve(true);
    } else if (type === ITEM_TYPE.URL) {
        const url = item.url;

        chrome.tabs.create({
            url
        });
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

function execCommand(box, dataList = [], item, fromWorkflow) {
    if (item && item.isDefault && !box.query) {
        return;
    } else if (!box.cmd || item.universal) {
        const result = handleNormalItem(box, dataList, item);
        const ret = handleEnterResult(result);

        window.stewardApp.emit('afterExecCommand', item, dataList, box.query);

        return ret;
    } else {
        let plugin;
        const command = box.command;

        if (box.command) {
            plugin = box.command.plugin
        } else if (plugin4empty) {
            plugin = plugin4empty;
        }

        if (item && item.key === 'workflow') {
            if (cmdbox.workflowStack.indexOf(item.wid) === -1) {
                return execWorkflow(item).then(() => {
                    box.command = command;
                    box.background = false;

                    try {
                        return Reflect.apply(plugin.onEnter, box, [item, command, box.query, box.shiftKey, dataList]);
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

            if (box.command && !box.command.allowBatch && item instanceof Array) {
                partial = item[0];
            }

            try {
                const result = Reflect.apply(plugin.onEnter, box, [partial, box.command, box.query, box.shiftKey, dataList]);

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

export function handleEnter (dataList, index, shiftKey) {
    cmdbox.workflowStack = [];
    cmdbox.shiftKey = shiftKey;

    execCommand(cmdbox, dataList, dataList[index]);
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
            input = part;
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
        cmdbox.workflowStack.push(item.wid);
        window.slogs = [`Workflow ${item.title}`];

        const cmds = parseWorkflow(item.content);
        const fromWorkflow = true;
        let task = Promise.resolve();

        console.log(cmds);
        cmds.forEach(cmd => {
            task = task.then(() => {
                return queryByInput(cmd.input, true);
            }).then(resp => {
                const { numbers } = cmd;

                cmdbox.shiftKey = cmd.withShift;

                if (resp && resp.length) {
                    if (numbers === NUM_ALL) {
                        return execCommand(cmdbox, resp, resp, fromWorkflow);
                    } else if (numbers instanceof Array) {
                        const [from, to] = fixNumbers(numbers);

                        return execCommand(cmdbox, resp, resp.slice(from, to + 1), fromWorkflow);
                    } else {
                        return execCommand(cmdbox, resp, resp[fixNumber(numbers)], fromWorkflow);
                    }
                } else {
                    return execCommand(cmdbox, resp, false, fromWorkflow);
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
        cmdbox.cmd = CONST.BASE.EMPTY_COMMAND;
        cmdbox.command = null;
        cmdbox.searchTimer = setTimeout(() => {
            Reflect.apply(plugin4empty.onBoxEmpty, cmdbox, []);
        }, cmdbox.delay);
    }
}

function init() {
    window.addEventListener('storage', function(event) {
        const command = cmdbox.command

        if (command) {
            const onStorageChange = command.plugin.onStorageChange;

            if (onStorageChange) {
                Reflect.apply(onStorageChange, cmdbox, [event, command]);
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
            app.$emit('apply:command', cmdbox.str);
        },

        updateList(list) {
            app.$emit('cmdbox:list', list);
        },

        clearQuery() {
            this.applyCommand(`${cmdbox.cmd} `);
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