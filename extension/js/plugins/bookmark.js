/**
 * @description search in bookmarks
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'

const chrome = window.chrome;
const version = 2;
const name = 'bookmark';
const key = 'bm';
const type = 'keyword';
const icon = chrome.extension.getURL('img/bookmark.png');
const title = chrome.i18n.getMessage(name + '_title');
const subtitle = chrome.i18n.getMessage(name + '_subtitle');
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

function searchBookmark(key, callback) {
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
    return new Promise((resolve, reject) => {
        searchBookmark(key, bookMarkList => {
            let arr = [];
            
            for (let i in bookMarkList) {
                let item = bookMarkList[i];

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