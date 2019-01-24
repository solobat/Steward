/**
 * @description search in bookmarks
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'

const chrome = window.chrome;
const version = 6;
const name = 'bookmark';
const keys = [
    { key: 'bm', shiftKey: true, allowBatch: true },
    { key: 'bmd' }
];
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/bookmark.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);

let bookmarks;

function getRecent() {
    if (bookmarks) {
        return Promise.resolve(bookmarks);
    } else {
        return new Promise(resolve => {
            chrome.bookmarks.getRecent(2147483647, items => {
                bookmarks = items.filter(item => Boolean(item.url)).map(item => {
                    item.mixed = `${item.title}!${item.url}`;
                    
                    return item;
                });

                resolve(bookmarks);
            });
        });
    }
}

function searchBookmark(query) {
    return getRecent().then(items => {
        if (query) {
            return util.getMatches(items, query, 'mixed');
        } else {
            return items.slice(0, 20);
        }
    });
}

function dataFormat(bookMarkList, command) {
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

    return arr;
}

function onInput(query, command) {
    if (query === '/' && window.parentHost) {
        window.stewardApp.applyCommand(`${command.key} ${window.parentHost}`);
    } else {
        return searchBookmark(query).then(bookMarkList => {
            return dataFormat(bookMarkList, command);
        });
    }
}

function onEnter(item, { orkey, key }, query, keyStatus, list) {
    if (orkey === 'bm') {
        util.batchExecutionIfNeeded(keyStatus.shiftKey, util.tabCreateExecs, [list, item], keyStatus);
    } else if (orkey === 'bmd') {
        return new Promise(resolve => {
            chrome.bookmarks.remove(item.id, () => {
                // clear cache
                bookmarks = null;
                window.stewardApp.refresh();
                window.slogs.push(`delete bookmark: ${item.url}`);

                util.toast.success('Delete successfully');

                resolve(true);
            });
        });
    }
}

export default {
    version,
    name: 'Bookmarks',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};