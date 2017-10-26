/**
 * @file script for new tab page
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import EasyComplete from '../common/easycomplete'
import util from '../common/util'
import storage from '../common/storage'
import CONST from '../common/const'
import { plugins }  from '../plugins/plugins'
import * as Wallpaper from './wallpaper'
import ga from '../../js/common/ga'
import KEY from '../constant/keycode'
import _ from 'underscore'

let commands = {};
let regExpCommands = [];
let otherCommands = [];
let searchContexts = [];
let keys;
let reg;
let cmdbox;

window.stewardCache = {};

function findMatchedPlugins(query) {
    let items = [];

    for (let key in commands) {
        if (key.indexOf(query) !== -1) {
            items.push({
                key: 'plugins',
                id: key,
                icon: commands[key].icon,
                title: key + ': ' + commands[key].title,
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

function init(config, mode, inContent) {
    $('.cmdbox').focus();

    if (mode === 'newTab') {
        Wallpaper.init();
    } else if (inContent) {
        _gaq.push(['_trackEvent', 'content', 'open']);
    }

    function callCommand(command, key) {
        if (!command) {
            return;
        }
        
        this.cmd = command.key;
        this.command = command;

        return command.plugin.onInput.call(this, key, command);
    }

    function searchInContext(query) {
        let res = [];
        let tasks = [];

        searchContexts.forEach(context => {
            let searchRet = context.onInput(query);

            if (searchRet instanceof Promise || typeof searchRet.then === 'function') {
                tasks.push(searchRet);
            } else if (searchRet && searchRet.length) {
                res.concat(searchRet);
            }
        });

        if (tasks.length) {
            return Promise.all(tasks).then(res => {
                return _.flatten(res.filter(item => item && item.length));
            });
        } else {
            return Promise.resolve(res);
        }
    }

    function regexpStage(cmdbox) {
        let str = cmdbox.str;
        let spCommand = findRegExpMatched(str);

        // handle regexp commands
        if (spCommand) {
            return Promise.reject(callCommand.call(cmdbox, spCommand, str));
        } else {
            return Promise.resolve(cmdbox);
        }
    }

    function searchStage(cmdbox) {
        let str = cmdbox.str;

        // match commands && search in contexts
        if (str.indexOf(' ') === -1) {
            let searched = searchInContext(str);
            let matchedPlugins = findMatchedPlugins(str);

            return Promise.all([
                searched,
                matchedPlugins
            ]).then(res => {
                let searchRes = _.flatten(res.filter(item => item && item.length));

                if (searchRes && searchRes.length) {
                    return Promise.reject(searchRes);
                } else {
                    return Promise.resolve(cmdbox, true);
                }
            });
        } else {
            return Promise.resolve(cmdbox);
        }
    }

    function commandStage(cmdbox, gothrough) {
        if (gothrough) {
            return Promise.resolve(cmdbox);
        }

        let str = cmdbox.str;
        let mArr = str.match(reg) || [];
        let cmd = mArr[1];
        let param = mArr[2];
        let key = mArr[3];

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
    
            let command = commands[cmdbox.cmd];
    
            return Promise.reject(callCommand.call(cmdbox, command, key));     
        } else {
            return Promise.resolve(cmdbox);
        }
    }

    function defaultStage(cmdbox) {
        if (otherCommands.length) {
            return callCommand.call(cmdbox, otherCommands[0], cmdbox.str);
        }
    }

    cmdbox = new EasyComplete({
        id: 'cmdbox',
        container: '#main',
        onInput: function (str) {
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
                .catch((msg) => {
                    if (msg) {
                        return Promise.resolve(msg);
                    }
                });
        },

        createItem: function (index, item) {
            let html = [
                '<div data-type="' + item.key + '" data-url="' + item.url + '" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
                '<img class="ec-item-icon" src="' + item.icon + '"/>',
                '<span class="ec-item-title ' + (item.isWarn ? 'ec-item-warn' : '') + '">' + item.title + '</span>',
                '<span class="ec-item-desc">' + item.desc + '</span>',
                '</div>'
            ];

            return html.join('');
        }

    });

    cmdbox.bind('init', function () {
        if (mode === 'newTab') {
            let cmd;
            if (config.general.cacheLastCmd) {
                cmd = storage.h5.get(CONST.LAST_CMD) || 'site ';
            } else if (config.general.defaultPlugin) {
                let defaultCommand = Object.values(commands).find(command => command.name === config.general.defaultPlugin);

                if (defaultCommand) {
                    cmd = defaultCommand.key + ' ';
                }
            }

            if (cmd) {
                this.ipt.val(cmd);
                this.render(cmd);
            }
        }
    });

    cmdbox.bind('enter', function (event, elem) {
        let $elem = $(elem);

        if (!this.cmd) {
            let type = $elem.data('type');
            
            if (type === 'plugins') {
                let key = $elem.data('id');

                this.render(key + ' ');
            } else if (type === 'url') {
                let url = $elem.data('url');

                chrome.tabs.create({
                    url
                });
            } else if (type === 'copy') {
                util.copyToClipboard($elem.data('url'), true);
            }

            return;
        }

        let plugin = this.command.plugin;
        let index = $elem.index();

        plugin.onEnter.call(this, this.dataList[index], this.command);
        
        if (plugin.name !== 'Help' && window.parentWindow) {
            window.parentWindow.postMessage({
                action: 'closeBox'
            }, '*');
        }
        _gaq.push(['_trackEvent', 'exec', 'enter', plugin.name]);
    });

    cmdbox.bind('empty', function () {
        var that = this;

        that.cmd = 'todo';
        that.searchTimer = setTimeout(function () {
            commands.todo.plugin.showTodos.call(that);
        }, that.delay);
    });

    cmdbox.bind('show', function () {
        this.ipt.addClass('cmdbox-drop');
    });

    cmdbox.bind('clear', function () {
        this.ipt.removeClass('cmdbox-drop');
    });

    cmdbox.clearQuery = function() {
        let newIpt = this.cmd + ' '

        this.query = ''
        this.str = this.term = newIpt
        this.ipt.val(newIpt)
    }

    cmdbox.init();

    if (mode === 'newTab') {
        $(document).on('keydown', function(event) {
            let keyType = util.isMac ? 'metaKey' : 'altKey';
            let keyCode = event.keyCode;

            if (event[keyType] && keyCode === KEY.RIGHT) {
                $('#main, .ec-itemList').fadeToggle();

                cmdbox.ipt.focus();
            }
        });
        ga();
    } else {
        setTimeout(ga, 200);
    }
}

function restoreConfig() {
    return new Promise((resove, reject) => {
        chrome.storage.sync.get('config', function(res) {
            let pluginsData;

            try {
                pluginsData = res.config.plugins;
            } catch (e) {
                console.log('There is no plugins configuration yet');
            }

            plugins.forEach((plugin) => {
                if (plugin.commands instanceof Array) {
                    let pname = plugin.name;
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
                        pcmds.forEach((command) => {
                            let cmd = {
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
            });

             keys = Object.keys(commands).join('|');
             reg = new RegExp('^((?:' + keys + '))\\s(?:\\-(\\w+))?\\s?(.*)$', 'i');

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

export default function(mode, inContent) {
    restoreConfig().then(config => {
        init(config, mode, inContent);
        document.execCommand('copy');
    });
};