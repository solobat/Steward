/**
 * @file bm command plugin script
 * @description 书签记录检索
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function(require, exports, module) {
    var util = require('../common/util');
    var title = '查找书签';
    var subtitle = '查找书签记录并打开';

    function createItem(index, item) {
        return [
            '<div data-type="bm" data-url="' + item.url + '" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
            '<span class="ec-item-name">' + item.title + '</span>',
            '<span class="ec-item-note">' + item.url + '</span>',
            '</div>'
        ];
    }

    function searchBookmark(cmdbox, key, callback) {
        if (!key) {
            chrome.bookmarks.getRecent(10, function (bookMarkList) {
                callback(bookMarkList || []);
            });

            return;
        }

        chrome.bookmarks.search(key, function(bookMarkList) {
            bookMarkList = bookMarkList || [];

            bookMarkList = bookMarkList.filter(function(bookmark) {
                return bookmark.url !== undefined;
            });

            callback(bookMarkList);
        });
    }

    function onInput(key) {
        var that = this;
        searchBookmark(that, key, function(bookMarkList) {
            that.showItemList(bookMarkList);
        });
    }

    function onEnter(id, elem) {
        window.open($(elem).data('url'));
    }

    module.exports = {
        key: 'bm',
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter,
        createItem: createItem

    };
});
