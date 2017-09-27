/**
 * @file script for new tab page
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var EasyComplete = require('/js/common/easycomplete');
    var util = require('/js/common/util');
    var storage = require('/js/common/storage');
    var CONST = require('/js/common/const');
    var regValidExpress = /^(==|~=|&&|\|\||[0-9]|[\+\-\*\/\^\.%, ""]|[\(\)\|\!\[\]])+$/;
    var plugins = require('../plugins/plugins').plugins;
    const Wallpaper = require('/js/main/wallpaper');

    var _gaq = window._gaq || [];
    var commands = {};
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

    function matchPlugins(query) {
        var items = findMatchPlugins(query);

        this.showItemList(items);
    }

    function init() {
        $('.cmdbox').focus();

        if ($('html').data('page') === 'newtab') {
            Wallpaper.init();
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

                if (regValidExpress.test(str)) {
                    this.cmd = 'calc';
                    storage.h5.set(CONST.LAST_CMD, str);

                    return commands.calc.plugin.onInput.call(this, str);
                }

                if (str.indexOf(' ') === -1) {
                    return matchPlugins.call(this, str);
                }

                // TODO: 空查询优化
                var mArr = str.match(reg) || [];
                var cmd = mArr[1];
                var param = mArr[2];
                var key = mArr[3];

                if (!cmd) {
                    this.clearList();
                    return;
                }

                this.cmd = cmd;
                this.param = param;
                this.query = key;

                storage.h5.set(CONST.LAST_CMD, str);

                if (this.lastcmd !== this.cmd) {
                    _gaq.push(['_trackEvent', 'command', 'input', this.cmd]);
                    this.lastcmd = this.cmd;
                }

                return commands[this.cmd].plugin.onInput.call(this, key);
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
            var cmd = storage.h5.get(CONST.LAST_CMD) || 'site ';

            this.ipt.val(cmd);
            this.render(cmd);
        });

        cmdbox.bind('enter', function (event, elem) {
            if (!this.cmd) {
                var key = $(elem).data('id');
                if (key) {
                    this.render(key + ' ');
                }

                return;
            }

            let plugin = commands[this.cmd].plugin;

            plugin.onEnter.call(this, $(elem).data('id'), elem);
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
                        let pcmds;

                        try {
                            pcmds = pluginsData[plugin.name].commands;
                        } catch (e) {
                            pcmds = plugin.commands;
                        }

                        // FIX: 新增插件后，缓存里可能还没有
                        if (pcmds) {
                            pcmds.forEach((command) => commands[command.key] = {
                                ...command,
                                name: plugin.name,
                                plugin
                            });
                        }
                    }
                });

                 keys = Object.keys(commands).join('|');
                 reg = new RegExp('^((?:' + keys + '))\\s(?:\\-(\\w+))?\\s?(.*)$', 'i');

                 stewardCache.commands = commands;
                 stewardCache.config = res.config;
                 resove(res);
            });
        });
    }

    restoreConfig().then(config => {
        console.log(stewardCache);
        init();
        document.execCommand('copy');
    });
});
