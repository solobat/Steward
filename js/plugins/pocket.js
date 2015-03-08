/**
 * @file po command plugin script
 * @description pocket文档查找
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var Auth = require('../common/auth');
    var conf = require('../conf/pocket_conf');
    var auth = new Auth(conf);

    var name = 'pocket';
    var key = 'po';
    var icon = 'http://getpocket.com/i/apple-touch-icon/Pocket_AppIcon_57.png';
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');

    function handler(results) {
        var ret = {};

        ret.request_token = results.split('=')[1];
        return ret;
    }

    var ajax;

    function dataFormat(rawList) {
        return rawList.map(function (item) {
            var title = item.given_title || item.resolved_title || item.excerpt;
            return {
                key: key,
                id: item.id,
                icon: icon,
                title: title,
                desc: subtitle

            };
        });
    }

    function onInput(key) {
        if (!key && !auth.isAuthenticated()) {
            auth.authenticate(handler);

            return;
        }

        var cmdbox = this;

        query(key, function (data) {
            cmdbox.showItemList(dataFormat(data));
        });
    }

    function query(key, callback) {
        if (ajax) {
            ajax.abort();
        }
        var params = {
            consumer_key: auth.consumer_key,
            access_token: auth.get(auth.accessTokenName)

        };

        if (key) {
            $.extend(params, {
                search: key,
                state: 'all'

            });
        }

        ajax = $.post('https://getpocket.com/v3/get', params, function (data) {
            if (data.list) {
                var list = [];
                for (var i in data.list) {
                    var item = data.list[i];

                    item.id = i;
                    list.push(item);
                }
                callback(list);
            }
        });
    }

    function onEnter(id, elem) {
        window.open('http://getpocket.com/a/read/' + id);
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
