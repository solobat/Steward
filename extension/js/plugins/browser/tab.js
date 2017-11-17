/**
 * @description list tabs and open
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import _ from 'underscore'

const version = 2;
const name = 'locateTab';
const key = 'tab';
const type = 'keyword';
const icon = chrome.extension.getURL('img/tab.png');
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

function getTabsByWindows(query, win) {
    return new Promise(resolve => {
        chrome.tabs.getAllInWindow(win.id, function (tabs) {
            const tabList = tabs.filter(function (tab) {
                return util.matchText(query, tab.title);
            });

            resolve(tabList);
        });
    });
}

function getAllTabs(query, callback) {
    chrome.windows.getAll(function (wins) {
        if (!wins.length) {
            return;
        }
        const tasks = [];

        for (let i = 0, len = wins.length; i < len; i = i + 1) {
            tasks.push(getTabsByWindows(query, wins[i]));
        }

        Promise.all(tasks).then(resp => {
            callback(_.flatten(resp));
        });
    });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        return {
            key: key,
            id: item.id,
            icon: item.favIconUrl || icon,
            title: item.title,
            desc: subtitle
        };
    });
}

function onInput(query) {
    return new Promise(resolve => {
        getAllTabs(query, function (data) {
            resolve(dataFormat(data));
        });
    });
}

function onEnter({ id }) {
    chrome.tabs.update(id, {
        active: true
    });
}

export default {
    version,
    name: 'Tabs',
    icon,
    title,
    commands,
    onInput,
    onEnter
};
