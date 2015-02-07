/**
 * @file his command plugin script
 * @description 历史记录检索
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var util = require('../common/util');

    function createItem(index, item) {
        return [
            '<div data-type="his" data-url="' + item.url + '" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
            '<span class="ec-item-name">' + item.title + '</span>',
            '</div>'
        ];
    }

    function searchHistory(cmdbox, key, callback) {
        chrome.history.search({
            text: key

        }, function (hisList) {
                if (hisList.length) {
                    callback(hisList);
                }
            });
    }

    function onInput(key) {
        var that = this;
        searchHistory(that, key, function (matchUrls) {
            that.showItemList(matchUrls);
        });
    }

    function onEnter(id, elem) {
        window.open($(elem).data('url'));
    }

    module.exports = {
        onInput: onInput,
        onEnter: onEnter,
        createItem: createItem

    };
});
