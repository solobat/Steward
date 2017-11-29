/**
 * @file help command plugin script
 * @description help
 * @author rong
 */

import _ from 'underscore'

const version = 3;
const name = 'help';
const key = 'help';
const type = 'keyword';
const icon = chrome.extension.getURL('img/help.ico');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    shiftKey: true,
    editable: true
}];

function getDocumentURL(item) {
    const baseUrl = 'https://steward-extension.gitbooks.io/steward/content/plugins';
    const exts = ['wd'];

    if (exts.indexOf(item.orkey) === -1) {
        return `${baseUrl}/browser/${item.name}.html`;
    } else {
        return `${baseUrl}/browser/extension/${item.name}.html`;
    }
}

// NOTE: Only get the commands when needed, main.js has been immediately obtained
// and then get the object will be empty
function getPlugins() {
    const allcommands = window.stewardCache.commands;
    const helpList = _.uniq(_.values(allcommands)).map(command => {
        return {
            icon: command.icon,
            id: command.key,
            orkey: command.orkey,
            name: command.name,
            title: `${command.key}: ${command.title}`,
            desc: `⇧: ${command.subtitle}`,
            type: command.type
        }
    }).filter(item => item.type === 'keyword');

    return _.sortBy(helpList, 'id');
}

function onInput() {
    return getPlugins();
}

function onEnter(item, command, query, shiftKey) {
    if (shiftKey) {
        chrome.tabs.create({
            url: getDocumentURL(item)
        });
    } else {
        return Promise.resolve(String(item.id.split(',')[0]));
    }
}

export default {
    version,
    name: 'Help',
    icon,
    title,
    commands,
    onInput,
    onEnter
};
