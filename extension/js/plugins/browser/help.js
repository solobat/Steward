/**
 * @file help command plugin script
 * @description help
 * @author rong
 */

import _ from 'underscore'

const version = 2;
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
    editable: true
}];

// NOTE: Only get the commands when needed, main.js has been immediately obtained
// and then get the object will be empty
function getPlugins() {
    const allcommands = window.stewardCache.commands;
    const helpList = _.uniq(_.values(allcommands)).map(command => {
        return {
            icon: command.icon,
            id: command.key,
            title: `${command.key}: ${command.title}`,
            desc: command.subtitle,
            type: command.type
        }
    }).filter(item => item.type === 'keyword');

    return _.sortBy(helpList, 'id');
}

function onInput() {
    return getPlugins();
}

function onEnter(item) {
    return Promise.resolve(String(item.id.split(',')[0]));
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
