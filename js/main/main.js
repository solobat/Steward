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

    var plugins = {
        tab: require('/js/plugins/tab'),
        on: require('/js/plugins/on'),
        off: require('/js/plugins/off'),
        set: require('/js/plugins/set'),
        del: require('/js/plugins/del'),
        run: require('/js/plugins/run'),
        his: require('/js/plugins/his'),
        bm: require('/js/plugins/bookmark'),
        yd: require('/js/plugins/yd'),
        todo: require('/js/plugins/todo'),
        po: require('/js/plugins/pocket'),
        calc: require('/js/plugins/calculate'),
        bk: require('/js/plugins/urlblock'),
        dl: require('/js/plugins/download'),
        help: require('/js/plugins/help')
    };

    var keys = Object.keys(plugins).join('|');
    var reg = new RegExp('^((?:' + keys + '))\\s(?:\\-(\\w+))?\\s?(.*)$', 'i');
    // TODO: options
    // delete plugins[xx, xx, xx]
    var cmdbox;

    function findMatchPlugins(query) {
        var items = [];

        for (var key in plugins) {
            if (key.indexOf(query) !== -1) {
                items.push({
                    key: 'plugins',
                    id: key,
                    icon: plugins[key].icon,
                    title: plugins[key].title || '',
                    desc: plugins[key].subtitle || ''

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

                    return plugins.calc.onInput.call(this, str);
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
                return plugins[this.cmd].onInput.call(this, key);
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
            var cmd = storage.h5.get(CONST.LAST_CMD) || 'todo ';

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

            plugins[this.cmd].onEnter.call(this, $(elem).data('id'), elem);
        });

        cmdbox.bind('empty', function () {
            var that = this;

            that.cmd = 'todo';
            that.searchTimer = setTimeout(function () {
                plugins.todo.showTodos.call(that);
            }, that.delay);
        });

        cmdbox.bind('show', function () {
            this.ipt.addClass('cmdbox-drop');
        });

        cmdbox.bind('clear', function () {
            this.ipt.removeClass('cmdbox-drop');
        });

        cmdbox.init();
    }

    init();
    document.execCommand('copy');
});
