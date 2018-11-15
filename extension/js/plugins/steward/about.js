/**
 * @description about steward
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import { getAboutLinks, getUpLinks } from '../../info/links'

const chrome = window.chrome;
const version = 1;
const name = 'about';
const keys = [
    { key: 'about', shiftKey: true, allowBatch: true, editable: false },
    { key: 'up', shiftKey: true, allowBatch: true, editable: false }
];
const type = 'keyword';
const icon = chrome.extension.getURL('img/icon.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);
const lang = chrome.i18n.getUILanguage().indexOf('zh') > -1 ? 'zh' : 'en';
const aboutLinks = getAboutLinks(lang);
const upLinks = getUpLinks(lang);

function dataFormat(list) {
    const wrapDesc = util.wrapWithMaxNumIfNeeded('desc');

    return list.map((item, i) => {
        const desc = wrapDesc(item, i);
        return {
            key: 'plugins',
            title: item.title,
            icon: item.icon || icon,
            desc,
            url: item.url
        };
    });
}

function onInput(query, command) {
    return new Promise(resolve => {
        if (command.orkey === 'about') {
            resolve(dataFormat(aboutLinks, command));
        } else {
            resolve(dataFormat(upLinks, command));
        }
    });
}

function onEnter(item, command, query, { shiftKey }, list) {
    util.batchExecutionIfNeeded(shiftKey, util.tabCreateExecs, [list, item]);
}

export default {
    version,
    name: 'About Steward',
    category: 'steward',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};