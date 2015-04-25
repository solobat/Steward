/**
 * @file bm command plugin script
 * @description 书签记录检索
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var chrome = window.chrome;
    var name = 'bookmark';
    var key = 'bm';
    var icon = chrome.extension.getURL('img/bookmark.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');


    function searchBookmark(cmdbox, key, callback) {
        if (!key) {
            chrome.bookmarks.getRecent(10, function (bookMarkList) {
                callback(bookMarkList || []);
            });

            return;
        }

        chrome.bookmarks.search(key, function (bookMarkList) {
            bookMarkList = bookMarkList || [];

            bookMarkList = bookMarkList.filter(function (bookmark) {
                return bookmark.url !== undefined;
            });

            callback(bookMarkList);
        });
    }

    function onInput(key) {
        var that = this;
        searchBookmark(that, key, function (bookMarkList) {
            var arr = [];
            for (var i in bookMarkList) {
                var item = bookMarkList[i];
                arr.push({
                    key: key,
                    id: item.id,
                    icon: icon,
                    url: item.url,
                    title: item.title,
                    desc: item.url,
                    isWarn: false

                });
            }
            that.showItemList(arr);
        });
    }

    function onEnter(id, elem) {
        chrome.tabs.create({
            url: $(elem).data('url')
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
