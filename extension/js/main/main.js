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

var commands = {};
var regExpCommands = [];
var otherCommands = [];
var keys;
var reg;
var cmdbox;

window.stewardCache = {};

function findMatchPlugins(query) {
    var items = [];

    for (var key in commands) {
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

    return items;
}

function findRegExpMatched(str) {
    return regExpCommands.find(item => {
        return item.regExp && str.match(item.regExp);
    });
}

function init(config, mode) {
    $('.cmdbox').focus();

    if ($('html').data('page') === 'newtab') {
        Wallpaper.init();
    }

    function callCommand(command, key) {
        if (!command) {
            return;
        }
        
        this.cmd = command.key;
        this.command = command;

        return command.plugin.onInput.call(this, key, command);
    }

    cmdbox = new EasyComplete({
        id: 'cmdbox',
        onInput: function (str) {
            if (!str) {
                this.empty();

                return;
            }

            this.str = str;
            this.cmd = '';
            this.param = '';
            this.query = '';

            let spCommand = findRegExpMatched(str);

            // handle regexp commands
            if (spCommand) {
               return callCommand.call(this, spCommand, str);
            }

            let matchPlugins = findMatchPlugins(str);

            // match commands
            if (str.indexOf(' ') === -1 && matchPlugins.length) {
                return this.showItemList(matchPlugins);
            }

            var mArr = str.match(reg) || [];
            var cmd = mArr[1];
            var param = mArr[2];
            var key = mArr[3];

            // handle other commands
            if (!cmd && otherCommands.length) {
                return callCommand.call(this, otherCommands[0], str);
            }

            this.cmd = cmd;
            this.param = param;
            this.query = key;

            storage.h5.set(CONST.LAST_CMD, str);

            if (this.lastcmd !== this.cmd) {
                _gaq.push(['_trackEvent', 'command', 'input', this.cmd]);
                this.lastcmd = this.cmd;
            }

            let command = commands[this.cmd];

            callCommand.call(this, command, key);
        },

        createItem: function (index, item) {
            var html = [
                '<div data-type="' + item.key + '" data-url="' + item.url + '" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
                '<img class="ec-item-icon" src="' + item.icon + '"/>',
                '<span class="ec-item-title ' + (item.isWarn ? 'ec-item-warn' : '') + '">' + item.title + '</span>',
                '<span class="ec-item-desc">' + item.desc + '</span>',
                '</div>'
            ];

            if (index <= 8) {
                var tipHtml = '<div class="ec-item-tip">' + (util.isMac ? '<span class="icon">⌃</span>' : 'ALT') + (index + 1) + '</div>';
                html.splice(html.length - 2, 0, tipHtml);
            }

            return html.join('');
        }

    });

    cmdbox.bind('init', function () {
        if (mode === 'newTab' && config.general.cacheLastCmd) {
            var cmd = storage.h5.get(CONST.LAST_CMD) || 'site ';

            this.ipt.val(cmd);
            this.render(cmd);
        }
    });

    cmdbox.bind('enter', function (event, elem) {
        let $elem = $(elem);

        if (!this.cmd) {
            var key = $elem.data('id');
            if (key) {
                this.render(key + ' ');
            }

            return;
        }

        let plugin = this.command.plugin;
        let index = $elem.index();

        plugin.onEnter.call(this, this.dataList[index], this.command);
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
        var newIpt = this.cmd + ' '

        this.query = ''
        this.str = this.term = newIpt
        this.ipt.val(newIpt)
    }

    cmdbox.init();

    if (mode === 'newTab') {
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
                                break;
                            }
                        });
                    }
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

export default function(mode) {
    restoreConfig().then(config => {
        init(config, mode);
        document.execCommand('copy');
    });
};