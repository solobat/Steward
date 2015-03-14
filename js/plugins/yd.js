/**
 * @file yd command plugin script
 * @description 有道翻译
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var util = require('../common/util');
    var url = 'https://fanyi.youdao.com/openapi.do?' +
    'keyfrom=mineword&key=1362458147&type=data&doctype=json&version=1.1&q=';
    var emptyReg = /^\s+$/g;

    var name = 'youdao';
    var key = 'yd';
    var icon = chrome.extension.getURL('img/youdao.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');

    function onInput(key) {
        if (emptyReg.test(key)) {
            return;
        }

        getTranslation(this, key);
    }

    function onEnter(id) {
    }

    function dataFormat(rawList) {
        return rawList.map(function (item) {
            return {
                key: key,
                id: item.id,
                icon: icon,
                title: item.text,
                desc: item.note

            };
        });
    }

    function getTranslation(cmdbox, key) {
        $.get(url + key, function (data) {
            if (!data.basic) {
                cmdbox.clearList();
                return;
            }
            var retData = [];
            var phonetic = '[' + [
                data.basic.phonetic,
                data.basic['uk-phonetic'],
                data.basic['us-phonetic']
            ].join(',') + ']';

            retData.push({
                text: data.translation.join(';') + phonetic,
                note: '翻译结果'

            });

            var explains = data.basic.explains.map(function (exp) {
                return {
                    text: exp,
                    note: '简明释义'

                };
            });

            var webs = data.web.map(function (web) {
                return {
                    text: web.value.join(', '),
                    note: '网络释义: ' + web.key

                };
            });

            retData = retData.concat(explains).concat(webs);

            cmdbox.showItemList(dataFormat(retData));
        });
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
