/**
 * @file url command plugin script
 * @description 待办事项管理，并在标签页显示
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var request = require('../common/request');
    var util = require('../common/util');

    var version = 2;
    var name = 'urlblock';
    var keys = [{ key: 'bk' }, { key: 'bk8' }];
    var icon = chrome.extension.getURL('img/urlblock.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');
    var BLOCK_EXPIRED = 8 * 60 * 60 * 1000;
    var commands = util.genCommands(name, icon, keys);

    function onInput(key, command) {
        if (!key) {
            showBlacklist.call(this, command.orkey);
        }
    }

    function onEnter(key, elem, command) {
        if (this.query) {
            addBlacklist.call(this, command.key, this.query, command.orkey);
        }
        else {
            removeBlacklist.call(this, key);
        }
    }

    function removeBlacklist(id) {
        var cmdbox = this;

        if (!id.startsWith('bk_') && (+new Date() - id) < BLOCK_EXPIRED) {
            console.log('url will be blocked 8 hours...');
            return;
        }

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

    function addBlacklist(key, url, type) {
        var cmdbox = this;

        getBlacklist(function (blacklist) {
            if (!blacklist || !blacklist.length) {
                blacklist = [];
            }
            let id;

            if (type === 'bk8') {
                id = +new Date();
            } else {
                id = 'bk_' + (+new Date());
            }


            blacklist.push({
                id,
                type,
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
                key: name,
                id: item.id,
                icon: icon,
                title: item.title,
                desc: subtitle
            };
        });
    }

    function showBlacklist(type) {
        var cmdbox = this;

        getBlacklist(function (blacklist) {
            if (blacklist) {
                blacklist = blacklist.filter(item => {
                    return type === (item.type || 'bk8');
                });
            }
            cmdbox.showItemList(dataFormat(blacklist || []));
        });
    }

    module.exports = {
        version,
        name: 'URL Block',
        icon,
        title,
        commands,
        onInput: onInput,
        onEnter: onEnter
    };
});
