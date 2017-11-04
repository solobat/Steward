/**
 * @file help command plugin script
 * @description help
 * @author rong
 */

import $ from 'jquery'
import _ from 'underscore'

const version = 2;
const name = 'help';
const key = 'help';
const type = 'keyword';
const icon = chrome.extension.getURL('img/help.ico');
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

// NOTE: Only get the commands when needed, main.js has been immediately obtained, and then get the object will be empty
function getPlugins() {
    let commands = window.stewardCache.commands;
    let helpList = _.uniq(_.values(commands)).map((command) => {
        return {
            icon: command.icon,
            id: command.key,
            title: command.key + ': ' + command.title,
            desc: command.subtitle,
            type: command.type
        }
    }).filter(item => item.type === 'keyword');

    return _.sortBy(helpList, 'id');
}

function onInput(key) {
    return getPlugins();
}

function onEnter(item) {
    this.render(item.id.split(',')[0] + '');
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
