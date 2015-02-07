/**
 * @file util
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var pinyin = require('pinyin');

    function getPinyin(name) {
        return pinyin(name, {
            style: pinyin['STYLE_NORMAL']

        }).join('');
    }

    function matchText(key, text) {
        text = getPinyin(text.toLowerCase());

        if (!key) {
            return true;
        }

        if (text.indexOf(key) > -1) {
            return true;
        }

        var plainKey = key.replace(/\s/g, '');
        var reg = new RegExp('.*' + plainKey.split('').join('.*') + '.*');

        return reg.test(text);
    }

    var isMac = navigator.platform === 'MacIntel';

    module.exports = {
        matchText: matchText,
        isMac: isMac

    };
});
