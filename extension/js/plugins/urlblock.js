/**
 * @file url command plugin script
 * @description 待办事项管理，并在标签页显示
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import request from '../common/request'
import util from '../common/util'

const version = 3;
const name = 'urlblock';
const keys = [{ key: 'bk' }, { key: 'bk8' }];
const type = 'keyword';
const icon = chrome.extension.getURL('img/urlblock.png');
const title = chrome.i18n.getMessage(name + '_title');
const subtitle = chrome.i18n.getMessage(name + '_subtitle');
const BLOCK_EXPIRED = 8 * 60 * 60 * 1000;
const commands = util.genCommands(name, icon, keys, type);

function onInput(key, command) {
    if (!key) {
        return showBlacklist.call(this, command.orkey);
    }
}

function onEnter(item, command) {
    if (this.query) {
        addBlacklist.call(this, command.key, this.query, command.orkey);
    }
    else {
        removeBlacklist.call(this, item.id);
    }
}

function removeBlacklist(id) {
    var cmdbox = this;

    if (!(String(id)).startsWith('bk_') && (+new Date() - id) < BLOCK_EXPIRED) {
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
    return new Promise(resolve => {
        getBlacklist(function (blacklist) {
            if (blacklist) {
                blacklist = blacklist.filter(item => {
                    return type === (item.type || 'bk8');
                });
            }
            resolve(dataFormat(blacklist || []));
        });
    });
}

export default {
    version,
    name: 'URL Block',
    icon,
    title,
    commands,
    onInput,
    onEnter
};
