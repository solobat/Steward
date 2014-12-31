define(function(require, exports, module) {
    var EasyComplete = require('./common/easycomplete');

    var cmdbox;
    // TODO: 改成配置的形式
    var plugins = {
        tab: require('./plugins/tab'),
        on: require('./plugins/on'),
        off: require('./plugins/off'),
        his: require('./plugins/his'),
        yd: require('./plugins/yd'),
        todo: require('./plugins/todo')
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
                var reg = /^((?:on|off|pb|tab|his|yd|todo))\s(.*)$/i;
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
                return plugins[this.cmd].createItem.call(this, index, item);
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