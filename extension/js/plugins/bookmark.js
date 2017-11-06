/**
 * @description search in bookmarks
 * @author tomasy
 * @email solopea@gmail.com
 */

const chrome = window.chrome;
const version = 2;
const name = 'bookmark';
const key = 'bm';
const type = 'keyword';
const icon = chrome.extension.getURL('img/bookmark.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

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

function onInput(query) {
    return new Promise(resolve => {
        searchBookmark(query, bookMarkList => {
            const arr = [];
            let i;

            for (i in bookMarkList) {
                const item = bookMarkList[i];

                arr.push({
                    key,
                    id: item.id,
                    icon,
                    url: item.url,
                    title: item.title,
                    desc: item.url,
                    isWarn: false
                });
            }

            resolve(arr);
        });
    });
}

function onEnter(item) {
    chrome.tabs.create({
        url: item.url
    });
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