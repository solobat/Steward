/**
 * @description list tabs and open
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import Toast from 'toastr'
import _ from 'underscore'
import browser from 'webextension-polyfill'

const version = 7;
const name = 'tabs';
const keys = [
    { key: 'tab' },
    { key: 'tabc', shiftKey: true, allowBatch: true },
    { key: 'tabm' },
    { key: 'tabp', allowBatch: true },
    { key: 'mute' }
];
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/tab.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);

function getAllTabs(query, callback) {
    chrome.windows.getAll({ populate: true }, function (wins) {
        if (wins.length) {
            let curWin;

            curWin = wins.find(win => win.focused);

            function getTabs() {
                const tabList = curWin.tabs.filter(function (tab) {
                    return util.matchText(query, `${tab.title}${tab.url}`);
                });

                callback(tabList);
            }

            if (!curWin) {
                // popup mode
                chrome.windows.getLastFocused({ populate: true }, result => {
                    curWin = result;

                    getTabs();
                })
            } else {
                getTabs();
            }
        } else {
            callback([]);
        }
    });
}

function getListByCommand(rawList, command) {
    let list;
    const { orkey } = command;

    if (orkey === 'tabm' || orkey === 'tabp' || orkey === 'mute') {
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
            icon: item.favIconUrl || chrome.extension.getURL('img/icon.png'),
            title: tabTitle,
            muted: item.mutedInfo.muted,
            desc,
            isWarn: item.active,
            raw: item
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
        Toast.warning(chrome.i18n.getMessage('tab_warning_invalidindex'));
        return Promise.resolve();
    }
}

function onEnter(item, {key, orkey}, query, { shiftKey }, list) {
    if (orkey === 'tab') {
        updateTab(item.id, {
            active: true
        });
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
    } else if (orkey === 'tabp') {
        const exces = [
            tab => updateTab(tab.id, { pinned: !tab.raw.pinned }),
            tab => updateTab(tab.id, { pinned: !tab.raw.pinned })
        ];
        return util.batchExecutionIfNeeded(shiftKey, exces, [list, item]).then(() => '');
    } else if (orkey === 'mute') {
        updateTab(item.id, {
            muted: !item.muted
        }).then(() => {
            window.stewardApp.refresh();
        });
    }
}

function updateTab(id, updateProperties) {
    return browser.tabs.update(id, updateProperties);
}

export default {
    version,
    name: 'Tabs',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};
