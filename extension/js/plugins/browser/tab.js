/**
 * @description list tabs and open
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import _ from 'underscore'

const version = 4;
const name = 'locateTab';
const keys = [
    { key: 'tab' },
    { key: 'tabc', shiftKey: true }
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

function dataFormat(rawList, command) {
    const wrapDesc = util.wrapWithMaxNumIfNeeded('', 20);
    return _.sortBy(rawList, 'active').map(function (item, index) {
        let desc = command.subtitle;

        if (command.shiftKey && !item.active) {
            desc = wrapDesc(command.subtitle, index);
        }

        return {
            key: command.key,
            id: item.id,
            icon: item.favIconUrl || icon,
            title: item.title,
            desc,
            isWarn: item.active
        };
    });
}

function onInput(query, command) {
    return new Promise(resolve => {
        getAllTabs(query, function (data) {
            resolve(dataFormat(data, command));
        });
    });
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

function onEnter({ id }, {key, orkey}, query, shiftKey, list) {
    if (orkey === 'tab') {
        locateTab(id);
    } else if (orkey === 'tabc') {
        let ids = [id];

        if (shiftKey) {
            ids = list.filter(item => !item.isWarn).map(item => item.id);
        }

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
