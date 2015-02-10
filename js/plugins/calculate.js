/**
 * @file del command script
 * @description delete extensions / apps by del command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

define(function(require, exports, module) {
    var util = require('../common/util');
    var title = '运算';
    var subtitle = '支持各种四则运算';


    function onInput() {
        var data = [];
        try {
            result = eval(this.str);
            data = [{
                key: title,
                text: result,
                note: subtitle
            }];
        }
        catch (e) {
        }

        return data;
    }

    function onEnter(id) {

    }

    function createItem(index, item) {
        var html = [
            '<div data-type="plugins" data-index="' + index + '" data-id="' + item.key + '" class="ec-item">',
            '<span class="ec-item-text">' + item.text + '</span>',
            '<span class="ec-item-note">' + item.note + '</span>',
            '</div>'
        ];

        return html;
    }

    module.exports = {
        onInput: onInput,
        onEnter: onEnter,
        createItem: createItem

    };
});
