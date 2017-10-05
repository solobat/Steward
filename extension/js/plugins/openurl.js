/**
 * @file del command script
 * @description delete extensions / apps by del command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'

var name = 'openurl';
var key = 'open';
var version = 1;
var icon = chrome.extension.getURL('img/openurl.png');
var title = chrome.i18n.getMessage(name + '_title');
var subtitle = chrome.i18n.getMessage(name + '_subtitle');
var withoutKey = true;
var regExp = /^(https?:\/\/)?(www\.)?(\w+\.)+\w{2,5}$/gi;
var commands = [{
    key,
    title,
    subtitle,
    icon,
    editable: false,
    withoutKey,
    regExp
}];

function onInput(url) {
    var data = [{
        key: 'url',
        id: name,
        icon,
        title: url,
        desc: subtitle,
        url
    }];

    return data;
}

function onEnter({ url }) {
    if (!/^https?/.test(url)) {
        url = 'http://' + url;
    }
    chrome.tabs.create({
        url
    });
}

export default {
    version,
    name: 'Open Url',
    icon,
    title,
    onInput,
    onEnter,
    commands,
    withoutKey
};