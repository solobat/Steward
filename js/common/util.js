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

    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    }

    function genCommands(name, icon, items) {
        return items.map(item => {
            let {key, editable, keyname} = item;

            return {
                key: item.key,
                orkey: item.key,
                title: chrome.i18n.getMessage(name + '_' + (keyname || key) + '_title'),
                subtitle: chrome.i18n.getMessage(name + '_' + (keyname || key) + '_subtitle'),
                icon,
                editable: editable === false ? false : true
            };
        });
    }

    function copyToClipboard(text) {
        document.addEventListener('copy', (event) => {
            event.preventDefault();
            event.clipboardData.setData('text/plain', text);
        }, {once: true});

        document.execCommand('copy');
    }

    module.exports = {
        matchText: matchText,
        isMac: isMac,
        guid: guid,
        genCommands,
        copyToClipboard
    };
});
