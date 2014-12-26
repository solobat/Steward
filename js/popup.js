define(function(require, exports, module) {
    var EasyComplete = require('./common/easycomplete');

    var cmdbox;
    // TODO: 改成配置的形式
    var plugins = {
        tab: require('./plugins/tab'),
        on: require('./plugins/on'),
        off: require('./plugins/off'),
        his: require('./plugins/his')
    };


    function init() {
        $('.cmdbox').focus();
        var nowCmd = '';

        cmdbox = new EasyComplete({
            id: 'cmdbox',
            oninput: function(str) {
                nowCmd = '';

                if (!str.indexOf(' ')) {
                    return;
                }

                // WHY: why /g can not capture (.+)
                // TODO: 改成配置的形式
                var reg = /^((?:on|off|pb|tab|his))\s(.*)$/i;
                var mArr = str.match(reg) || [];
                var cmd = mArr[1];
                var key = mArr[2];

                if (!cmd) {
                    cmdbox.clearList();
                    return;
                }

                nowCmd = cmd;

                plugins[nowCmd].onInput(cmdbox, key);

                return;
            },

            onEnter: function() {
                plugins[nowCmd].onEnter.call(this, cmdbox, $(this).data('id'));
            },

            createItem: function(index, item) {
                return plugins[nowCmd].createItem(index, item);
            }
        });
    }

    init();
});