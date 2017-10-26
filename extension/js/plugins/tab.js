/**
 * @file tab command plugin script
 * @description 标签页查找
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'

const version = 2;
const name = 'locateTab';
const key = 'tab';
const type = 'keyword';
const icon = chrome.extension.getURL('img/tab.png');
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

function getAllTabs(key, callback) {
    chrome.windows.getAll(function (wins) {
        if (!wins.length) {
            return;
        }
        var data = [];
        for (var i = 0, len = wins.length; i < len; i++) {
            // 闭包
            (function (index) {
                chrome.tabs.getAllInWindow(wins[index].id, function (tabs) {
                    var tabList = tabs.filter(function (tab) {
                        return util.matchText(key, tab.title);
                    });

                    data = data.concat(tabList);

                    if (index === len - 1) {
                        callback(data);
                    }
                });
            })(i);
        }
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

function onInput(key) {
    return new Promise(resolve => {
        getAllTabs(key, function (data) {
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
