/**
 * @description search
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import Toast from 'toastr'

const name = 'newtab';
const key = 'nt';
const version = 1;
const type = 'keyword';
const icon = chrome.extension.getURL('img/new-tab.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    mode: 'newTab',
    icon,
    editable: true
}];
const allActions = [
    {
        icon,
        key: 'visibleOnlyFocued',
        title: chrome.i18n.getMessage('newtab_visibleOnlyFocued_title'),
        desc: chrome.i18n.getMessage('newtab_visibleOnlyFocued_subtitle'),
        type: 'boolean'
    },
    {
        icon,
        key: 'newTabTitle',
        title: chrome.i18n.getMessage('newtab_newTabTitle_title'),
        desc: chrome.i18n.getMessage('newtab_newTabTitle_subtitle'),
        type: 'string'
    }
];

function onInput() {
    return Promise.resolve(allActions);
}

function onEnter(item) {
    const actionType = item.type;

    if (actionType === 'boolean') {
        toggleAction(item);
    } else if (actionType === 'string') {
        setNewValueFromUserInput(item);
    }
}

function toggleAction(item) {
    const oldValue = window.localStorage.getItem(item.key);
    const newValue = oldValue ? '' : '1';

    window.localStorage.setItem(item.key, newValue);

    Toast.success(`Toggle ${item.title} successfully!`);
}

function setNewValueFromUserInput(item) {
    const oldValue = window.localStorage.getItem(item.key) || 'New Tab';

    const result = window.prompt(item.title, oldValue);

    window.localStorage.setItem(item.key, result || 'New Tab');
    Toast.success('Set successfully');
}

export default {
    version,
    name: 'New Tab',
    icon,
    title,
    onInput,
    onEnter,
    commands
};