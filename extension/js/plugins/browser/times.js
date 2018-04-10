/**
 * @description todo
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import Toast from 'toastr'
import STORAGE from '../../constant/storage'
import browser from 'webextension-polyfill'
import moment from 'moment'

const version = 1;
const name = 'times';
const keys = [
    { key: 'ts' },
    { key: 'tsd' }
];
const type = 'keyword';
const icon = chrome.extension.getURL('img/plusone.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);
const formatWarningMsg = chrome.i18n.getMessage('times_ts_warn_format');

const queryReg = /^([^/]+)\/([mwd])\/([1-9]\d*)(?:\/([+-]))?$/i;
let intervalMap;

if (chrome.i18n.getUILanguage().indexOf('zh') > -1) {
    intervalMap = {
        m: '每月',
        w: '每周',
        d: '每天'
    };
} else {
    intervalMap = {
        m: 'Month',
        w: 'Week',
        d: 'Day'
    };
}

const titleTemplate = chrome.i18n.getMessage(`times_ts_tpl_title`);
const subtitleMoreTemplate = chrome.i18n.getMessage(`times_ts_tpl_subtitle_more`);
const subtitleLessTemplate = chrome.i18n.getMessage(`times_ts_tpl_subtitle_less`);

function handleTimesInput(query, command) {
    if (!query || command.orkey === 'tsd') {
        return getTimes().then(times => {
            if (times && times.length) {
                return dataFormat(times || [], command);
            } else {
                return util.getDefaultResult(command);
            }
        });
    } else {
        return util.getDefaultResult(command);
    }
}

function onInput(query, command) {
    const orkey = command.orkey;

    if (orkey === 'ts') {
        return handleTimesInput(query, command);
    } else if (orkey === 'tsd') {
        return handleTimesInput(query, command);
    }
}

function handleTimesaEnter(item, command, query, shiftKey) {
    if (query) {
        return addTimes(query, command);
    } else {
        return updateCount(item.raw, shiftKey);
    }
}

function onEnter(item, command, query, shiftKey) {
    const orkey = command.orkey;

    if (orkey === 'ts') {
        return handleTimesaEnter(item, command, query, shiftKey);
    } else if (orkey === 'tsd') {
        return removeTimes(item.raw, command);
    }
}

function updateCount(item, shiftKey) {
    const newCount = shiftKey ? item.curCount - 1 : item.curCount + 1;

    item.curCount = newCount || 0;

    if (item.curCount < 0) {
        item.curCount = 0;
    }

    return updateTimes(item);
}

function createTimes(text, task, interval, count, overflowType = '+') {
    return {
        text,
        task,
        interval,
        count,
        curCount: 0,
        date: Number(new Date()),
        overflowType
    };
}

function updateTimes(newItem, command) {
    return getTimes().then((resp = []) => {
        const times = resp;
        const oldItem = times.find(item => item.task === newItem.task);

        if (oldItem) {
            Object.assign(oldItem, newItem);
        } else {
            times.push(newItem);
        }

        return browser.storage.sync.set({
            [STORAGE.TIMES]: times
        }).then(() => {
            if (command) {
                return `${command.key} `;
            } else {
                return '';
            }
        });
    });
}

function removeTimes(ditem, command) {
    return getTimes().then((resp = []) => {
        const times = resp.filter(item => item.task !== ditem.task);

        return browser.storage.sync.set({
            [STORAGE.TIMES]: times
        }).then(() => {
            if (command) {
                return `${command.key} `;
            } else {
                return '';
            }
        });
    });
}

function addTimes(query, command) {
    const match = query.trim().match(queryReg);
    if (match) {
        const [text, task, interval, count, overflowType] = match;
        const newTask = createTimes(text, task, interval, count, overflowType);

        return util.isStorageSafe(STORAGE.TIMES).then(() => {
            return updateTimes(newTask, command);
        }).catch(() => {
            Toast.warning(chrome.i18n.getMessage('STORAGE_WARNING'));

            return Promise.reject();
        });
    } else {
        Toast.warning(formatWarningMsg);
    }
}

function getTimes() {
    return browser.storage.sync.get(STORAGE.TIMES).then(results => results[STORAGE.TIMES]);
}

function getTaskText(item) {
    const data = {
        task: item.task,
        interval: intervalMap[item.interval],
        curCount: item.curCount || 0
    };

    return util.simTemplate(titleTemplate, data);
}

function getTaskSubtitle(item) {
    const data = {
        count: item.count
    };

    if (item.overflowType === '-') {
        return util.simTemplate(subtitleLessTemplate, data);
    } else {
        return util.simTemplate(subtitleMoreTemplate, data);
    }
}

function checkIsWarn({ count, curCount = 0, overflowType = '+' }) {
    if (overflowType === '+') {
        return curCount < count;
    } else {
        return curCount > count;
    }
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        return {
            key: 'plugin',
            id: item.id,
            icon: icon,
            title: getTaskText(item),
            desc: getTaskSubtitle(item),
            isWarn: checkIsWarn(item),
            raw: item
        };
    });
}

function isAfter(date, taskType) {
    return moment().isAfter(date, taskType);
}

function refreshTimes() {
    const timeInterval = {
        d: 'day',
        w: 'week',
        m: 'month'
    };

    getTimes()
        .then((times = []) => {
            let changed = false;

            times.forEach(item => {
                const taskType = timeInterval[item.interval];

                if (isAfter(item.date, taskType)) {
                    item.date = Number(new Date());
                    item.curCount = 0;
                    changed = true;
                    console.log('refresh: ', item);
                }
            });

            if (changed) {
                return times;
            } else {
                return null;
            }
        })
        .then(times => {
            if (times) {
                return browser.storage.sync.set({
                    [STORAGE.TIMES]: times
                });
            }
        });
}

refreshTimes();

export default {
    version,
    name: 'Times',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: true
};