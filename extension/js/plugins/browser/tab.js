/**
 * @description list tabs and open
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import Toast from 'toastr'
import _ from 'underscore'

const version = 6;
const name = 'locateTab';
const keys = [
    { key: 'tab' },
    { key: 'tabc', shiftKey: true, allowBatch: true },
    { key: 'tabm' }
];
const type = 'keyword';
const icon = chrome.extension.getURL('img/tab.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);

function getTabsByWindows(query, win) {
    return new Promise(resolve => {
        chrome.tabs.getAllInWindow(win.id, function (tabs) {
            const tabList = tabs.filter(function (tab) {
                return util.matchText(query, `${tab.title}${tab.url}`);
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

function getListByCommand(rawList, command) {
    let list;

    if (command.orkey === 'tabm') {
        list = _.sortBy(rawList, 'active').reverse();
    } else {
        list = _.sortBy(rawList, 'active');
    }

    return list;
}

function dataFormat(rawList, command) {
    const wrapDesc = util.wrapWithMaxNumIfNeeded('', 20);
    const list = getListByCommand(rawList, command);

    return list.map(function (item, index) {
        let desc = command.subtitle;

        if (command.shiftKey && !item.active) {
            desc = wrapDesc(command.subtitle, index);
        }
        const tabTitle = item.active ? `Active: ${item.title}` : item.title;

        return {
            key: command.key,
            id: item.id,
            icon: item.favIconUrl || icon,
            title: tabTitle,
            desc,
            isWarn: item.active
        };
    });
}

function queryTabs(query, command) {
    return new Promise(resolve => {
        getAllTabs(query, function (data) {
            resolve(dataFormat(data, command));
        });
    });
}

function onInput(query, command) {
    if (command.orkey === 'tabm') {
        return queryTabs('', command);
    } else {
        return queryTabs(query, command);
    }
}

function locateTab(id) {
    chrome.tabs.update(id, {
        active: true
    });
}

function removeTabs(ids) {
    return new Promise(resolve => {
        chrome.tabs.remove(ids, () => {
            resolve(true);
        });
    });
}

function moveTab(tabId, query) {
    const index = parseInt(query, 10) - 1;

    if (index >= -1) {
        return new Promise(resolve => {
            chrome.tabs.move(tabId, { index }, resp => {
                console.log(resp);
                resolve('');
            });
        });
    } else {
        Toast.warning('The input is not a valid index');
        return Promise.resolve();
    }
}

function onEnter(item, {key, orkey}, query, shiftKey, list) {
    if (orkey === 'tab') {
        locateTab(item.id);
    } else if (orkey === 'tabc') {
        let items;

        if (shiftKey) {
            items = list;
        } else if (item instanceof Array) {
            items = item;
        } else {
            items = [item];
        }

        const ids = items.filter(it => !it.isWarn).map(it => {
            window.slogs.push(`close tab: ${it.title}`);
            return it.id;
        });

        return removeTabs(ids).then(() => {
            return new Promise(resolve => {
                // Tab interface update is not very timely
                setTimeout(() => {
                    if (query) {
                        resolve(`${key} `);
                    } else {
                        resolve('');
                    }
                }, 200);
            });
        });
    } else if (orkey === 'tabm') {
        return moveTab(item.id, query);
    }
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
