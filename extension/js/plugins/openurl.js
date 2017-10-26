/**
 * @description open url in browser
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'

const version = 2;
const name = 'openurl';
const key = 'open';
const type = 'regexp';
const icon = chrome.extension.getURL('img/openurl.png');
const title = chrome.i18n.getMessage(name + '_title');
const subtitle = chrome.i18n.getMessage(name + '_subtitle');
const regExp = /^(https?:\/\/)?(www\.)?(\w+\.)+\w{2,5}$/gi;
const commands = [{
    key,
    title,
    type,
    subtitle,
    icon,
    editable: false,
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
    commands
};