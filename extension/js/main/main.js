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
import CONST from '../common/const'
import {plugins} from '../plugins/browser'
import * as Wallpaper from './wallpaper'
import ga from '../../js/common/ga'
import KEY from '../constant/keycode'
import _ from 'underscore'
import { websitesMap } from '../plugins/website'

const commands = {};
const regExpCommands = [];
const otherCommands = [];
const searchContexts = [];
let plugin4empty;
let keys;
let reg;
let cmdbox;
let mode;
let inContent;

window.stewardCache = {};

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
    const param = mArr[2];
    const key = mArr[3];

    // search in context && handle other commands
    if (cmd) {
        cmdbox.cmd = cmd;
        cmdbox.param = param;
        cmdbox.query = key;

        storage.h5.set(CONST.LAST_CMD, str);

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
        result.then(data => {
            if (typeof data === 'string') {
                cmdbox.render(data);
            } else {
                const isRetain = data === true;

                if (!isRetain) {
                    const delay = typeof data === 'number' ? data : delay4close;

                    setTimeout(() => {
                        cmdbox.trigger('shouldCloseBox');
                    }, delay);
                }
            }
        });
    } else {
        cmdbox.trigger('shouldCloseBox');
    }
}

function handleOnInput(str) {
    if (!str) {
        this.empty();

        return;
    }

    this.str = str;
    this.cmd = '';
    this.param = '';
    this.query = '';

    return regexpStage(this)
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
    const descStr = item.desc ? `<span class="ec-item-desc ${item.lazyDesc ? 'lazy' : ''}">${item.desc}</span>` : ''

    const html = `
        <div data-type="${item.key}" data-url="${item.url}" data-index="${index}" data-id="${item.id}" class="ec-item">
            <img class="ec-item-icon" src="${item.icon}" />
            <div class="${contentClass}">
                <span class="${titleClass}">${item.title}</span>
                ${descStr}
            </div> 
        </div>
        `;

    return html;
}

function handleInit () {
    const config = stewardCache.config;

    if (mode === 'newTab') {
        let cmd;
        if (config.general.cacheLastCmd) {
            cmd = storage.h5.get(CONST.LAST_CMD) || 'site ';
        } else if (config.general.defaultPlugin) {
            const defaultCommand = Object.values(commands).find(command => command.name === config.general.defaultPlugin);

            if (defaultCommand) {
                cmd = `${defaultCommand.key} `;
            }
        }

        if (cmd) {
            this.ipt.val(cmd);
            this.render(cmd);
        }
    }
}

function handleEnter (event, elem) {
    const $elem = $(elem);
    const item = this.dataList[$elem.index()];

    if (!this.cmd) {
        const type = $elem.data('type');

        if (type === 'plugins') {
            const key = $elem.data('id');

            this.render(`${key} `);
        } else if (type === 'url') {
            const url = $elem.data('url');

            chrome.tabs.create({
                url
            });
        } else if (type === 'copy') {
            util.copyToClipboard($elem.data('url'), true);
        } else if (type === 'action') {
            this.trigger('action', {
                action: 'command',
                info: item
            });
        }

        _gaq.push(['_trackEvent', 'exec', 'enter', type]);

        if (type !== 'plugins') {
            this.trigger('shouldCloseBox');
        }

        return;
    }

    let plugin;

    if (this.command) {
        plugin = this.command.plugin
    } else if (plugin4empty) {
        plugin = plugin4empty;
    }
    const index = $elem.index();
    const result = Reflect.apply(plugin.onEnter, this, [this.dataList[index], this.command, this.query]);

    handleEnterResult(result);

    _gaq.push(['_trackEvent', 'exec', 'enter', plugin.name]);
}

function handleEmpty() {
    if (plugin4empty) {
        this.cmd = '_empty_';
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
}

function initWallpaper() {
    Wallpaper.init();

    $(document).on('keydown', function(event) {
        const keyType = util.isMac ? 'metaKey' : 'altKey';
        const keyCode = event.keyCode;

        if (event[keyType] && keyCode === KEY.RIGHT) {
            $('#main, .ec-itemList').fadeToggle();

            cmdbox.ipt.focus();
        }
    });
}

function init() {
    prepareBox();

    cmdbox = new EasyComplete({
        id: 'cmdbox',
        container: '#list-wrap',
        onInput: handleOnInput,
        createItem
    });

    cmdbox.bind('init', handleInit);
    cmdbox.bind('enter', handleEnter);
    cmdbox.bind('empty', handleEmpty);
    cmdbox.bind('show', handleShow);
    cmdbox.bind('clear', handleClear);
    cmdbox.clearQuery = clearQuery;

    cmdbox.init();

    if (mode === 'newTab') {
        initWallpaper();
        ga();
    } else if(!inContent) {
        setTimeout(ga, 200);
    }
}

function classifyPlugins(pluginsData) {
    plugins.forEach(plugin => {
        if (!plugin.invalid) {
            if (typeof plugin.onBoxEmpty === 'function') {
                plugin4empty = plugin;
            }
            if (plugin.commands instanceof Array) {
                const pname = plugin.name;
                let pcmds;

                try {
                    pcmds = pluginsData[pname].commands;
                    if (plugin.version > (pluginsData[pname].version || 1)) {
                        pcmds = $.extend(true, plugin.commands, pcmds);
                    }
                } catch (e) {
                    pcmds = plugin.commands;
                }

                // FIX: if add new plugin, the cache may not have
                if (pcmds) {
                    pcmds.forEach(command => {
                        const cmd = {
                            ...command,
                            name: pname,
                            plugin
                        };

                        switch(command.type) {
                        case 'regexp':
                            regExpCommands.push(cmd);
                            break;
                        case 'other':
                            otherCommands.push(cmd);
                            break;
                        case 'keyword':
                            commands[command.key] = cmd;
                            break;
                        default:
                            // bugfix
                            commands[command.key] = cmd;
                            break;
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
        chrome.storage.sync.get('config', function(res) {
            let pluginsData;

            try {
                pluginsData = res.config.plugins;
            } catch (e) {
                console.log('There is no plugins configuration yet');
            }

            classifyPlugins(pluginsData, inContent);

             keys = Object.keys(commands).join('|');
             reg = new RegExp(`^((?:${keys}))\\s(?:\\-(\\w+))?\\s?(.*)$`, 'i');

             stewardCache.commands = commands;
             stewardCache.config = res.config || {};

            if (!stewardCache.config.general) {
                stewardCache.config.general = {
                    cacheLastCmd: true
                }
            }
             resove(stewardCache.config);
        });
    });
}

export default function(themode, isInContent) {
    inContent = isInContent;
    mode = themode;

    return restoreConfig().then(() => {
        init();
        document.execCommand('copy');

        return cmdbox;
    });
}