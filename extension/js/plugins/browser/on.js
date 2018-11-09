/**
 * @description enable extensions/apps
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'

const version = 2;
const name = 'onExtension';
const key = 'on';
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/on.svg');
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
        getExtensions(query.toLowerCase(), false, function (matchExts) {
            resolve(dataFormat(matchExts));
        });
    });
}

function onEnter(item) {
    if (item && item.id) {
        setEnabled(item.id, true);
        window.slogs.push(`Enable: ${item.title}`);
        window.stewardApp.refresh();
    }
}

export default {
    version,
    name: 'Enable Extension',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};
