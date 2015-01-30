define(function(require, exports, module) {
    var EasyComplete = require('./common/easycomplete');
    var util = require('./common/util');

    var cmdbox;
    // TODO: 改成配置的形式
    // cannot use forEach
    // TODO: use for
    var plugins = {
        tab: require('./plugins/tab'),
        on: require('./plugins/on'),
        off: require('./plugins/off'),
        run: require('./plugins/run'),
        his: require('./plugins/his'),
        yd: require('./plugins/yd'),
        todo: require('./plugins/todo'),
        po: require('./plugins/pocket')
    };

    function init() {
        $('.cmdbox').focus();

        cmdbox = new EasyComplete({
            id: 'cmdbox',
            onInput: function(str) {
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
                var reg = /^((?:on|off|run|pb|tab|his|yd|todo|po))\s(.*)$/i;
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

                return;
            },

            onEnter: function(elem) {
                plugins[this.cmd].onEnter.call(this, $(elem).data('id'), elem);
            },

            createItem: function(index, item) {
                var html = plugins[this.cmd].createItem.call(this, index, item);

                if (index <= 8) {
                    var tipHtml = '<div class="ec-item-tip">' + (util.isMac ? 'CMD' : 'ALT') +
                    ' + ' + (index + 1) + '</div>';
                    html.splice(html.length - 2, 0, tipHtml);
                }

                return html.join('');
            },

            onEmpty: function() {
                var that = this;

                that.cmd = 'todo';
                that.searchTimer = setTimeout(function() {
                    plugins.todo.showTodos.call(that);
                }, that.delay);
            }
        });
    }

    init();
});