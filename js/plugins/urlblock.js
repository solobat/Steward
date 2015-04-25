/**
 * @file url command plugin script
 * @description 待办事项管理，并在标签页显示
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var request = require('../common/request');

    var name = 'urlblock';
    var key = 'bk';
    var icon = chrome.extension.getURL('img/urlblock.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');

    function onInput(key) {
        if (!key) {
            showBlacklist.call(this);
        }
    }

    function onEnter(key, elem) {
        if (this.query) {
            addBlacklist.call(this, this.query);
        }
        else {
            removeBlacklist.call(this, key);
        }
    }

    function removeBlacklist(id) {
        var cmdbox = this;
        getBlacklist(function (blacklist) {
            blacklist = blacklist.filter(function (url) {
                return url.id !== id;
            });

            chrome.storage.sync.set({
                url: blacklist

            }, function () {
                    cmdbox.refresh();
                });
        });
    }

    function addBlacklist(url) {
        var cmdbox = this;

        getBlacklist(function (blacklist) {
            if (!blacklist || !blacklist.length) {
                blacklist = [];
            }

            blacklist.push({
                id: +new Date(),
                title: url

            });

            chrome.storage.sync.set({
                url: blacklist

            }, function () {
                    cmdbox.render(key + ' ');
                    noticeBackground('blockUrl', url);
                });
        });
    }

    function noticeBackground(action, url) {
        request.send({
            action: action,
            data: {
                url: url
            }

        });
    }

    function getBlacklist(callback) {
        chrome.storage.sync.get('url', function (results) {
            var blacklist = results.url;

            callback(blacklist);
        });
    }

    function dataFormat(rawList) {
        return rawList.map(function (item) {
            return {
                key: key,
                id: item.id,
                icon: icon,
                title: item.title,
                desc: subtitle

            };
        });
    }

    function showBlacklist() {
        var cmdbox = this;

        getBlacklist(function (blacklist) {
            cmdbox.showItemList(dataFormat(blacklist));
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
