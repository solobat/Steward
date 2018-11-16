/**
 * @description open url in browser
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import urlRegex from 'url-regex'
import util from '../../common/util'

const version = 3;
const name = 'openurl';
const key = 'open';
const type = 'regexp';
const icon = chrome.extension.getURL('iconfont/openurl.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const regExp = urlRegex({exact: true, strict: false});
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
    const data = [{
        key: 'url',
        id: name,
        icon,
        title: url,
        desc: subtitle,
        url
    }];

    return data;
}

function onEnter({ url }, command, query, keyStatus) {
    let theurl = url;

    if (!/^https?/.test(url)) {
        theurl = `http://${url}`;
    }
    util.createTab({ url: theurl }, keyStatus);
}

export default {
    version,
    name: 'Open Url',
    category: 'other',
    icon,
    title,
    onInput,
    onEnter,
    commands,
    canDisabled: false
};