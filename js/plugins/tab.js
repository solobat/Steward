/**
 * @file tab command plugin script
 * @description 标签页查找
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var util = require('../common/util');

    var name = 'locateTab';
    var key = 'tab';
    var icon = chrome.extension.getURL('img/tab.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');

    function getAllTabs(key, callback) {
        chrome.windows.getAll(function (wins) {
            if (!wins.length) {
                return;
            }
            var data = [];
            for (var i = 0, len = wins.length; i < len; i++) {
                // 闭包
                (function (index) {
                    chrome.tabs.getAllInWindow(wins[index].id, function (tabs) {
                        var tabList = tabs.filter(function (tab) {
                            return util.matchText(key, tab.title);
                        });

                        data = data.concat(tabList);

                        if (index === len - 1) {
                            callback(data);
                        }
                    });
                })(i);
            }
        });
    }

    function dataFormat(rawList) {
        return rawList.map(function (item) {
            return {
                key: key,
                id: item.id,
                icon: item.favIconUrl,
                title: item.title,
                desc: subtitle

            };
        });
    }

    function onInput(key) {
        var that = this;
        getAllTabs(key, function (data) {
            that.showItemList(dataFormat(data));
        });
    }

    function onEnter(id) {
        chrome.tabs.update(id, {
            active: true

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
