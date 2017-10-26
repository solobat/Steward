/**
 * @description delete extensions / apps by del command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'

const version = 2;
const name = 'deleteExtension';
const key = 'del';
const type = 'keyword';
const icon = chrome.extension.getURL('img/del.png');
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

function uninstall(id, cb) {
    chrome.management.uninstall(id, function () {
        cb.apply(null, arguments);
    });
}

// get all
function getExtensions(key, enabled, callback) {
    chrome.management.getAll(function (extList) {
        var matchExts = extList.filter(function (ext) {
            return util.matchText(key, ext.name);
        });

        callback(matchExts);
    });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        var url = item.icons instanceof Array ? item.icons[item.icons.length - 1].url : '';
        var isWarn = item.installType === 'development';
        return {
            key: key,
            id: item.id,
            icon: url,
            title: item.name,
            desc: item.description,
            isWarn: isWarn

        };
    });
}
function onInput(key) {
    return new Promise((resolve) => {
        getExtensions(key.toLowerCase(), false, function (matchExts) {
            sortExtensions(matchExts, key, function (matchExts) {
                resolve(dataFormat(matchExts));
            });
        });
    });
}

function onEnter(item) {
    uninstall(item.id, function () {
        // cb
    });
    this.refresh();
}

function sortExtFn(a, b) {
    return a.num === b.num ? b.update - a.upate : b.num - a.num;
}

function sortExtensions(matchExts, key, callback) {
    chrome.storage.sync.get('ext', function (data) {
        let sExts = data.ext;

        if (!sExts) {
            callback(matchExts);
            return;
        }

        // sExts: {id: {id: '', querys: {'key': {num: 0, update: ''}}}}
        matchExts = matchExts.map(function (extObj) {
            var id = extObj.id;

            if (!sExts[id] || !sExts[id].querys[key]) {
                extObj.num = 0;
                extObj.upate = 0;

                return extObj;
            }

            extObj.num = sExts[id].querys[key].num;
            extObj.update = sExts[id].querys[key].update;

            return extObj;
        });

        matchExts.sort(sortExtFn);

        callback(matchExts);
    });
}

export default {
    version,
    name: 'Delete Extension',
    icon,
    title,
    commands,
    onInput,
    onEnter
};
