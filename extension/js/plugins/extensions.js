/**
 * @description extensions
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../common/util'

const version = 1;
const name = 'viewExtension';
const key = 'ext';
const type = 'keyword';
const icon = chrome.extension.getURL('img/viewext.png');
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

function getExtensions(query, callback) {
    chrome.management.getAll(function (extList) {
        const data = extList.filter(function (ext) {
            return util.matchText(query, ext.name);
        });

        callback(data);
    });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        const url = item.icons instanceof Array ? item.icons[0].url : '';
        const isWarn = item.installType === 'development';

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

function onInput(query) {
    return new Promise(resolve => {
        getExtensions(query.toLowerCase(), function (data) {
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
    onInput,
    onEnter
};
