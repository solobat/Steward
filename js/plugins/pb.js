/**
 * @file pb command plugin script
 * @description pushbullet API 调用
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    // TODO
    var util = require('../common/util');

    function createItem(index, item) {
        return '';
    }

    function onInput(key) {
    }

    function onEnter(id) {
    }

    module.exports = {
        key: 'pb',
        onInput: onInput,
        onEnter: onEnter,
        createItem: createItem

    };
});
