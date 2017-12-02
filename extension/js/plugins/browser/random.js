/**
 * @description todo
 * @author tomasy
 * @email solopea@gmail.com
 */

import ItemsStorage from '../../helper/storage'

const version = 1;
const name = 'random';
const key = 'random';
const type = 'keyword';
const icon = chrome.extension.getURL('img/random.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const randomStorage = new ItemsStorage('Random Commands', 'randomCmds', true);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

const defaultResult = [{
    icon,
    title,
    desc: subtitle
}];

function onInput(query) {
    if (!query) {
        return randomStorage.getItems().then((resp = []) => {
            return dataFormat(resp);
        });
    } else {
        return Promise.resolve(defaultResult);
    }
}

function onEnter(item, command, query) {
    if (query) {
        return randomStorage.addItem(query).then(() => {
            return `${command.orkey} `;
        });
    } else {
        return randomStorage.removeItem(item.id).then(() => {
            return '';
        });
    }
}

function dataFormat(rawList = []) {
    const desc = chrome.i18n.getMessage('random_remove_subtitle');

    return rawList.map(function (item) {
        return {
            key: key,
            id: item,
            icon: icon,
            title: item,
            desc
        };
    });
}

function getOneCommand() {
    return randomStorage.getItems().then(items => {
        if (items && items.length) {
            return items[Math.floor(Math.random() * items.length)];
        } else {
            return '';
        }
    })
}

export default {
    version,
    name: 'Random Commands',
    icon,
    title,
    commands,
    getOneCommand,
    onInput,
    onEnter
};