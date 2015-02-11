/**
 * @file del command script
 * @description delete extensions / apps by del command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

define(function (require, exports, module) {
    var key = 'calc';
    var icon = chrome.extension.getURL('img/calc.png');
    var title = '运算';
    var subtitle = '支持各种四则运算';

    function onInput() {
        var data = [];
        try {
            result = eval(this.str);
            data = [
                {
                    key: title,
                    icon: icon,
                    title: result,
                    desc: subtitle

                }
            ];
        }
        catch (e) {}

        return data;
    }

    function onEnter(id) {
    }

    module.exports = {
        key: key,
        icon: icon,
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter

    };
});
