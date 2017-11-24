/**
 * @description search in bookmarks
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'

const chrome = window.chrome;
const version = 5;
const name = 'bookmark';
const keys = [
    { key: 'bm', shiftKey: true, allowBatch: true },
    { key: 'bmd' }
];
const type = 'keyword';
const icon = chrome.extension.getURL('img/bookmark.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);

function searchBookmark(query, callback) {
    if (!query) {
        chrome.bookmarks.getRecent(10, function (bookMarkList) {
            callback(bookMarkList || []);
        });

        return;
    }

    chrome.bookmarks.search(query, function (data) {
        let bookMarkList = data || [];

        bookMarkList = bookMarkList.filter(function (bookmark) {
            return typeof bookmark.url !== 'undefined';
        });

        callback(bookMarkList);
    });
}

function onInput(query, command) {
    return new Promise(resolve => {
        searchBookmark(query, bookMarkList => {
            let wrapDesc;

            if (command.shiftKey) {
                wrapDesc = util.wrapWithMaxNumIfNeeded('url');
            }

            const arr = [];
            let i;

            for (i in bookMarkList) {
                const item = bookMarkList[i];
                let desc = item.url;

                if (wrapDesc) {
                    desc = wrapDesc(item, i);
                }

                arr.push({
                    key: command.key,
                    id: item.id,
                    icon,
                    url: item.url,
                    title: item.title,
                    desc,
                    isWarn: false
                });
            }

            resolve(arr);
        });
    });
}

function onEnter(item, { orkey }, query, shiftKey, list) {
    if (orkey === 'bm') {
        util.batchExecutionIfNeeded(shiftKey, util.tabCreateExecs, [list, item]);
    } else if (orkey === 'bmd') {
        return new Promise(resolve => {
            chrome.bookmarks.remove(item.id, () => {
                resolve('');
                window.slogs.push(`delete bookmark: ${item.url}`);
            });
        });
    }
}

export default {
    version,
    name: 'Bookmarks',
    icon,
    title,
    commands,
    onInput,
    onEnter
};