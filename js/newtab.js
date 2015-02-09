/**
 * @file script for new tab page
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var EasyComplete = require('./common/easycomplete');
    var util = require('./common/util');
    var storage = require('./common/storage');
    var CONST = require('./common/const');

    var plugins = {
        tab: require('./plugins/tab'),
        on: require('./plugins/on'),
        off: require('./plugins/off'),
        del: require('./plugins/del'),
        run: require('./plugins/run'),
        his: require('./plugins/his'),
        yd: require('./plugins/yd'),
        todo: require('./plugins/todo'),
        po: require('./plugins/pocket')

    };
    // TODO: optionson
    // delete plugins[xx, xx, xx]

    var cmdbox;

    function findMatchPlugins(query) {
        var items = [];
        for (var key in plugins) {
            if (key.indexOf(query) !== -1) {
                items.push({
                    key: key,
                    title: plugins[key].title || '',
                    subtitle: plugins[key].subtitle || ''
                });
            }
        }

        return items;
    }

    function matchPlugins(query) {
        var items = findMatchPlugins(query);

        this.showItemList(items, function (index, item) {
            var html = [
                '<div data-type="plugins" data-index="' + index + '" data-id="' + item.key + '" class="ec-item">',
                '<span class="ec-plugin-name">' + item.key + '</span>',
                '<span class="ec-plugin-title">' + item.title + '</span>',
                '<span class="ec-plugin-subtitle">' + item.subtitle + '</span>',
                '</div>'
            ];

            if (index <= 8) {
                var tipHtml = '<div class="ec-item-tip">'
                + (util.isMac ? 'CMD' : 'ALT') + ' + ' + (index + 1) + '</div>';
                html.splice(html.length - 2, 0, tipHtml);
            }

            return html.join('');
        });
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

                this.cmd = '';
                this.query = '';

                if (str.indexOf(' ') === -1) {
                    matchPlugins.call(this, str);
                    return;
                }

                // WHY: why /g can not capture (.+)
                // TODO: 改成配置的形式
                var reg = /^((?:on|off|del|run|pb|tab|his|yd|todo|po))\s(.*)$/i;
                var mArr = str.match(reg) || [];
                var cmd = mArr[1];
                var key = mArr[2];

                if (!cmd) {
                    this.clearList();
                    return;
                }

                this.cmd = cmd;
                this.query = key;

                plugins[this.cmd].onInput.call(this, key);

                storage.h5.set(CONST.LAST_CMD, str);
                return;
            },

            createItem: function (index, item) {
                var html = plugins[this.cmd].createItem.call(this, index, item);

                if (index <= 8) {
                    var tipHtml = '<div class="ec-item-tip">'
                    + (util.isMac ? 'CMD' : 'ALT') + ' + ' + (index + 1) + '</div>';
                    html.splice(html.length - 2, 0, tipHtml);
                }

                return html.join('');
            }

        });

        cmdbox.bind('init', function () {
            var cmd = storage.h5.get(CONST.LAST_CMD) || 'todo ';

            this.ipt.val(cmd);
            this.open(cmd);
        });

        cmdbox.bind('enter', function (event, elem) {
            if (!this.cmd) {
                var key = $(elem).data('id');
                this.open(key + ' ');

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
});
