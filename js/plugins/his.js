/**
 * @file his command plugin script
 * @description 历史记录检索
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var name = 'history';
    var key = 'his';
    var icon = chrome.extension.getURL('img/history.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');

    function searchHistory(cmdbox, key, callback) {
        chrome.history.search({
            text: key

        }, function (hisList) {
                hisList = hisList || [];
                hisList = hisList.filter(function (his) {
                    return !!his.title;
                });

                callback(hisList);
            });
    }

    function dataFormat(rawList) {
        return rawList.map(function (item) {
            return {
                key: key,
                id: item.id,
                icon: icon,
                title: item.title,
                desc: item.url,
                url: item.url

            };
        });
    }

    function onInput(key) {
        var that = this;
        searchHistory(that, key, function (matchUrls) {
            that.showItemList(dataFormat(matchUrls));
        });
    }

    function onEnter(id, elem) {
        window.open($(elem).data('url'));
    }

    module.exports = {
        key: 'his',
        icon: icon,
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter

    };
});
