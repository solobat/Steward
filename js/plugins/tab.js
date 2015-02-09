/**
 * @file tab command plugin script
 * @description 标签页查找
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var util = require('../common/util');
    var title = '跳转到标签页';
    var subtitle = '查找并跳转至标签页';

    function getAllTabs(key, callback) {
        chrome.windows.getAll(function (wins) {
            if (!wins.length) {
                return;
            }
            var matchTabs = [];
            for (var i = 0, len = wins.length; i < len; i++) {
                // 闭包
                (function (index) {
                    chrome.tabs.getAllInWindow(wins[index].id, function (tabs) {
                        var tabList = tabs.filter(function (tab) {
                            return util.matchText(key, tab.title);
                        });

                        matchTabs = matchTabs.concat(tabList);

                        if (index === len - 1) {
                            callback(matchTabs);
                        }
                    });
                })(i);
            }
        });
    }

    function createItem(index, item) {
        return [
            '<div data-type="tab" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
            '<img class="ec-item-icon" src="' + item.favIconUrl + '" alt="" />',
            '<span class="ec-item-name">' + item.title + '</span>',
            '</div>'
        ];
    }

    function onInput(key) {
        var that = this;
        getAllTabs(key, function (matchTabs) {
            that.showItemList(matchTabs);
        });
    }

    function onEnter(id) {
        chrome.tabs.update(id, {
            active: true

        });
    }

    module.exports = {
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter,
        createItem: createItem

    };
});
