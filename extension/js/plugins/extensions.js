/**
 * @file run command plugin script
 * @description 启动指定应用
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'

var version = 1;
var name = 'viewExtension';
var key = 'ext';
var type = 'keyword';
var icon = chrome.extension.getURL('img/viewext.png');
var title = chrome.i18n.getMessage(name + '_title');
var subtitle = chrome.i18n.getMessage(name + '_subtitle');
var commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

function getExtensions(key, callback) {
    chrome.management.getAll(function (extList) {
        var data = extList.filter(function (ext) {
            return util.matchText(key, ext.name);
        });

        callback(data);
    });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        var url = item.icons instanceof Array ? item.icons[0].url : '';
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
    return new Promise((resolve, reject) => {
        getExtensions(key.toLowerCase(), function (data) {
            resolve(dataFormat(data));
        });
    });
}

function onEnter({ id }) {
    chrome.tabs.create({
        url: `chrome://extensions/?id=${id}`
    });
}

export default {
    version,
    name: 'View Extension',
    icon,
    title,
    commands,
    onInput: onInput,
    onEnter: onEnter
};
