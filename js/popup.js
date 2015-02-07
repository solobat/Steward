/**
 * @file script for popup page
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var EasyComplete = require('./common/easycomplete');
    var util = require('./common/util');
    var storage = require('./common/storage');
    var CONST = require('./common/const');

    // TODO: 改成配置的形式, but cannot use forEach
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

    var cmdbox;

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

                if (!str.indexOf(' ')) {
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
            plugins[this.cmd].onEnter.call(this, $(elem).data('id'), elem);
        });

        cmdbox.bind('empty', function () {
            var that = this;

            that.cmd = 'todo';
            that.searchTimer = setTimeout(function () {
                plugins.todo.showTodos.call(that);
            }, that.delay);
        });

        cmdbox.init();
    }

    init();
});
