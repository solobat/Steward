/**
 * @description find in history
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'

const version = 4;
const name = 'history';
const key = 'his';
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/history.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    allowBatch: true,
    shiftKey: true,
    editable: true
}];

function searchHistory(query, callback) {
    chrome.history.search({
        text: query
    }, function (data) {
            let hisList = data || [];

            hisList = hisList.filter(function (his) {
                return Boolean(his.title);
            });

            callback(hisList);
        });
}

function dataFormat(rawList, command) {
    let wrapDesc;

    if (command.shiftKey) {
        wrapDesc = util.wrapWithMaxNumIfNeeded('url');
    }

    return rawList.map(function (item, i) {
        let desc = item.url;

        if (wrapDesc) {
            desc = wrapDesc(item, i);
        }
        return {
            key: key,
            id: item.id,
            icon: icon,
            title: item.title,
            desc,
            url: item.url
        };
    });
}

function onInput(query, command) {
    if (query === '/' && window.parentHost) {
        return `${command.key} ${window.parentHost}`;
    } else {
        return new Promise(resolve => {
            searchHistory(query, function (matchUrls) {
                resolve(dataFormat(matchUrls, command));
            });
        });
    }
}

function onEnter(item, command, query, { shiftKey }, list) {
    util.batchExecutionIfNeeded(shiftKey, util.tabCreateExecs, [list, item]);
    return Promise.resolve('');
}

export default {
    version,
    name: 'History',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};
