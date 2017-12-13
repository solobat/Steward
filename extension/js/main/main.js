/**
 * @file script for new tab page
 * @author tomasy
 * @email solopea@gmail.com
 */
/*global _gaq stewardCache*/

import $ from 'jquery'
import EasyComplete from '../common/easycomplete'
import util from '../common/util'
import storage from '../common/storage'
import CONST from '../constant'
import {plugins} from '../plugins/browser'
import * as Wallpaper from './wallpaper'
import ga from '../../js/common/ga'
import _ from 'underscore'
import { websitesMap } from '../plugins/website'
import defaultGeneral from '../../js/conf/general'
import Toast from 'toastr'

const commands = {};
const regExpCommands = [];
const otherCommands = [];
const searchContexts = [];
let plugin4empty;
let randomPlugin;
let keys;
let reg;
let cmdbox;
let mode;
let inContent;

window.stewardCache = {};
window.slogs = [];

function findMatchedPlugins(query) {
    const items = [];
    let key;

    for (key in commands) {
        if (key.indexOf(query) !== -1) {
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
    cmdbox.command = command;

    return Reflect.apply(command.plugin.onInput, cmdbox, [key, command, inContent]);
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
        const searchRet = context.onInput(query);

        if (searchRet instanceof Promise || typeof searchRet.then === 'function') {
            tasks.push(searchRet);
        } else if (searchRet && searchRet.length) {
            res.concat(searchRet);
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

function regexpStage() {
    const str = cmdbox.str;
    const spCommand = findRegExpMatched(str);

    // handle regexp commands
    if (spCommand) {
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
            _gaq.push(['_trackEvent', 'command', 'input', cmdbox.cmd]);
            cmdbox.lastcmd = cmdbox.cmd;
        }

        const command = commands[cmdbox.cmd];

        return Promise.reject(callCommand(command, key));
    } else {
        return Promise.resolve(cmdbox);
    }
}

function defaultStage() {
    if (otherCommands.length) {
        return callCommand(otherCommands[0], cmdbox.str);
    }
}

function handleEnterResult(result) {
    const delay4close = 1000;

    if (result && result instanceof Promise) {
        return result.then(data => {
            if (typeof data === 'string') {
                if (data) {
                    cmdbox.render(data);
                } else {
                    cmdbox.refresh();
                }
            } else {
                const isRetain = data === true;

                if (!isRetain) {
                    const delay = typeof data === 'number' ? data : delay4close;

                    setTimeout(() => {
                        cmdbox.trigger('shouldCloseBox');
                    }, delay);
                }
            }
        }).catch(() => {});
    } else {
        cmdbox.trigger('shouldCloseBox');
    }
}

function handleOnInput(str) {
    if (!str) {
        this.empty();

        return;
    }

    return queryByInput(this, str);
}

function queryByInput(box, str, background) {
    box.str = str;
    box.cmd = '';
    box.query = '';

    if (background) {
        box.background = true;
    }

    return regexpStage(box)
        .then(searchStage)
        .then(commandStage)
        .then(defaultStage)
        .catch(msg => {
            if (msg) {
                return Promise.resolve(msg);
            }
        });
}

function createItem (index, item) {
    const contentClass = [
        'ec-item-content',
        item.desc ? '' : 'nodesc'
    ].join(' ');
    const titleClass = [
        'ec-item-title',
        item.isWarn ? 'ec-item-warn' : ''
    ].join(' ');
    const enterIconUrl = mode === CONST.BASE.MODE.NEWTAB ? chrome.extension.getURL('img/enter.png') :
        chrome.extension.getURL('img/enter-white.png');
    const descStr = item.desc ? `<span class="ec-item-desc ${item.lazyDesc ? 'lazy' : ''}">${item.desc}</span>` : ''

    const html = `
        <div data-type="${item.key}" data-url="${item.url}" data-index="${index}" data-id="${item.id}" class="ec-item">
            <img class="ec-item-icon" src="${item.icon}" />
            <div class="${contentClass}">
                <span class="${titleClass}">${item.title}</span>
                ${descStr}
            </div>
            <img class="ec-item-icon icon-enter" src="${enterIconUrl}">
        </div>
        `;

    return html;
}

function applyCmd(cmd) {
    if (cmd) {
        cmdbox.ipt.val(cmd);
        cmdbox.render(cmd);
    }
}

function handleInit () {
    const config = stewardCache.config;

    if (mode === 'newTab') {
        const { cacheLastCmd, defaultPlugin, customCmd } = config.general;
        let cmd;

        if (util.shouldSupportMe()) {
            cmd = 'up ';
            applyCmd(cmd);
        } else if (cacheLastCmd) {
            cmd = storage.h5.get(CONST.STORAGE.LAST_CMD) || 'site ';
            applyCmd(cmd);
        } else if (defaultPlugin) {
            if (defaultPlugin === 'Other') {
                if (customCmd) {
                    applyCmd(config.general.customCmd);
                }
            } else if (defaultPlugin === 'Random') {
                randomPlugin.getOneCommand().then(applyCmd);
            } else {
                const defaultCommand = Object.values(commands).find(command => command.name === defaultPlugin);

                if (defaultCommand) {
                    applyCmd(`${defaultCommand.key} `);
                }
            }
        }
    }
}

function handleNormalItem(box, dataList, item) {
    const ITEM_TYPE = CONST.BASE.ITEM_TYPE;
    const type = item.key;

    if (type === ITEM_TYPE.PLUGINS) {
        const key = item.id;

        box.render(`${key} `);
    } else if (type === ITEM_TYPE.URL) {
        const url = item.url;

        chrome.tabs.create({
            url
        });
    } else if (type === ITEM_TYPE.COPY) {
        util.copyToClipboard(item.url, true);
    } else if (type === ITEM_TYPE.ACTION) {
        box.trigger('action', {
            action: 'command',
            info: item
        });
    }

    _gaq.push(['_trackEvent', 'exec', 'enter', type]);

    if (type !== ITEM_TYPE.PLUGINS) {
        box.trigger('shouldCloseBox');
    }
}

function execCommand(box, dataList = [], item, fromWorkflow) {
    if (item && item.isDefault && !box.query) {
        return;
    } else if (!box.cmd) {
        return handleNormalItem(box, dataList, item);
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

                    return Reflect.apply(plugin.onEnter, box, [item, command, box.query, box.shiftKey, dataList]);
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

            const result = Reflect.apply(plugin.onEnter, box, [partial, box.command, box.query, box.shiftKey, dataList]);

            if (!fromWorkflow) {
                const enterResult = handleEnterResult(result);
                _gaq.push(['_trackEvent', 'exec', 'enter', plugin.name]);

                return enterResult;
            } else {
                return result;
            }
        }
    }
}

function handleEnter (event, elem) {
    const $elem = $(elem);
    const index = $elem.length ? $elem.index() : 0;

    cmdbox.workflowStack = [];

    execCommand(cmdbox, this.dataList, this.dataList[index]);
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
                return queryByInput(cmdbox, cmd.input, true);
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

function handleEmpty() {
    if (plugin4empty) {
        this.cmd = CONST.BASE.EMPTY_COMMAND;
        this.command = null;
        this.searchTimer = setTimeout(() => {
            Reflect.apply(plugin4empty.onBoxEmpty, this, []);
        }, this.delay);
    }
}

function handleShow() {
    this.ipt.addClass('cmdbox-drop');
}

function handleClear() {
    this.ipt.removeClass('cmdbox-drop');
}

function clearQuery() {
    const newIpt = `${this.cmd} `;

    this.query = '';
    this.str = this.term = newIpt;
    this.ipt.val(newIpt);
}

function prepareBox() {
    const $cmdbox = $('.cmdbox');

    $cmdbox.focus();

    // force focus in content page
    if (inContent) {
        window.addEventListener('focus', () => {
            $cmdbox.focus();
        });
        $cmdbox.blur(function() {
            $cmdbox.focus();
        });
    }

    if (mode === CONST.BASE.MODE.NEWTAB &&
         window.stewardCache.config.general.autoHideCmd) {
        $cmdbox.addClass('autohide');
    }
}

function initWallpaper() {
    Wallpaper.init();

    $(document).on('keydown', function(event) {
        const keyType = util.isMac ? 'metaKey' : 'altKey';
        const keyCode = event.keyCode;

        if (event[keyType] && keyCode === CONST.KEY.RIGHT) {
            $('#main, .ec-itemList').fadeToggle();

            cmdbox.ipt.focus();
        }
    });
}

function init() {
    prepareBox();

    const { autoScrollToMiddle, autoResizeBoxFontSize } = stewardCache.config.general;
    cmdbox = new EasyComplete({
        id: 'cmdbox',
        container: '#list-wrap',
        onInput: handleOnInput,
        autoScroll: autoScrollToMiddle,
        autoResizeBoxFontSize,
        createItem
    });

    cmdbox.bind('init', handleInit);
    cmdbox.bind('enter', handleEnter);
    cmdbox.bind('empty', handleEmpty);
    cmdbox.bind('show', handleShow);
    cmdbox.bind('clear', handleClear);
    cmdbox.clearQuery = clearQuery;

    cmdbox.init();

    if (mode === CONST.BASE.MODE.NEWTAB) {
        initWallpaper();
        $('body').fadeIn(100, function() {
            cmdbox.ipt.focus();
        });
        ga();
    } else if(!inContent) {
        setTimeout(ga, 200);
    }
}

function classifyPlugins(pluginsData) {
    const PLUGIN_TYPE = CONST.BASE.PLUGIN_TYPE;

    plugins.forEach(plugin => {
        if (!plugin.invalid) {
            if (typeof plugin.onBoxEmpty === 'function') {
                plugin4empty = plugin;
            }

            if (plugin.name === 'Random Commands') {
                randomPlugin = plugin;
            }

            if (plugin.commands instanceof Array) {
                const pname = plugin.name;
                const pcmds = pluginsData[pname].commands;

                if (pcmds) {
                    // commands in cache is simple version
                    const realCommands = $.extend(true, plugin.commands, pcmds);

                    realCommands.forEach(command => {
                        if (!command.mode || (command.mode && command.mode === mode)) {
                            const cmd = {
                                ...command,
                                name: pname,
                                plugin
                            };

                            switch(command.type) {
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
                }
            } else {
                searchContexts.push(plugin);
            }
        }
    });

    if (inContent && websitesMap[window.parentHost]) {
        searchContexts.push(websitesMap[window.parentHost]);
    }
}

function restoreConfig() {
    return new Promise(resove => {
        chrome.storage.sync.get(CONST.STORAGE.CONFIG, function(res) {
            classifyPlugins(res.config.plugins, inContent);

             keys = Object.keys(commands).join('|');
             reg = new RegExp(`^((?:${keys}))\\s(.*)$`, 'i');

             stewardCache.commands = commands;
             stewardCache.config = res.config || {};

            if (!stewardCache.config.general) {
                stewardCache.config.general = defaultGeneral;
            }
             resove(stewardCache.config);
        });
    });
}

export default function(themode, isInContent) {
    inContent = isInContent;
    mode = themode;
    stewardCache.inContent = isInContent;
    stewardCache.mode = mode;

    return restoreConfig().then(() => {
        init();
        document.execCommand('copy');

        return cmdbox;
    });
}