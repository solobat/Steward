/**
 * @description disable extensions/apps
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import util from '../../common/util'

const version = 2;
const name = 'offExtension';
const key = 'off';
const type = 'keyword';
const icon = chrome.extension.getURL('img/off.png');
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

function setEnabled(id, enabled) {
    chrome.management.setEnabled(id, enabled, function () {});
}

function getExtensions(query, enabled, callback) {
    chrome.management.getAll(function (extList) {
        const matchExts = extList.filter(function (ext) {
            return util.matchText(query, ext.name) && ext.enabled === enabled;
        });

        callback(matchExts);
    });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        const url = item.icons instanceof Array ? item.icons[item.icons.length - 1].url : '';
        const isWarn = item.installType === 'development';

        return {
            key,
            id: item.id,
            icon: url,
            title: item.name,
            desc: item.description,
            isWarn
        };
    });
}

function onInput(query) {
    return new Promise(resolve => {
        getExtensions(query.toLowerCase(), true, function (matchExts) {
            sortExtensions(matchExts, query, function (data) {
                resolve(dataFormat(data));
            });
        });
    });
}

function onEnter(item) {
    if (item && item.id) {
        setEnabled(item.id, false);
        this.refresh();
        window.slogs.push(`Disable: ${item.title}`);
        addRecord('ext', this.query, item.id);
    }
}

function sortExtFn(a, b) {
    return a.num === b.num ? b.update - a.upate : b.num - a.num;
}

function sortExtensions(data, query, callback) {
    let matchExts = data;

    chrome.storage.sync.get('ext', function (data) {
        const sExts = data.ext;

        if (!sExts) {
            callback(matchExts);
            return;
        }

        // sExts: {id: {id: '', querys: {'key': {num: 0, update: ''}}}}
        matchExts = matchExts.map(function (extObj) {
            const id = extObj.id;

            if (!sExts[id] || !sExts[id].querys[query]) {
                extObj.num = 0;
                extObj.upate = 0;

                return extObj;
            }

            extObj.num = sExts[id].querys[query].num;
            extObj.update = sExts[id].querys[query].update;

            return extObj;
        });

        matchExts.sort(sortExtFn);

        callback(matchExts);
    });
}

function addRecord(recordKey, query, id) {
    chrome.storage.sync.get(recordKey, function (data) {
        // data = {ext: {}}
        const extObj = data;
        // info = {id: {}};
        let info = extObj[recordKey];

        if ($.isEmptyObject(extObj)) {
            info = extObj[recordKey] = {};
        }

        let obj;

        if (!info[id]) {
            obj = info[id] = createObj4Storage(id, query);
        } else {
            obj = info[id];

            if (obj.querys[query]) {
                obj.querys[query].num += 1;
            } else {
                obj.querys[query] = {
                    num: 1,
                    update: Number(new Date())

                };
            }
        }

        chrome.storage.sync.set(extObj, function () {});
    });
}

function createObj4Storage(id, query) {
    const obj = {
        id: id,
        querys: {}
    };

    obj.querys[query] = {
        num: 1,
        update: Number(new Date())

    };

    return obj;
}

export default {
    version,
    name: 'Disable Extension',
    icon,
    title,
    commands,
    onInput,
    onEnter
};
