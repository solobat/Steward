/**
 * @description cusotm the newTab default command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import { PLUGIN_TYPE } from '../../constant/base'
import Toast from 'toastr'

const version = 1;
const name = 'custom';
const key = 'custom';
const type = PLUGIN_TYPE.KEYWORD;
const icon = chrome.extension.getURL('img/icon.png');
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

function onInput() {
    return [{
        key,
        title,
        desc: subtitle,
        icon
    }];
}

function onEnter(item, command, query) {
    if (query) {
        chrome.runtime.sendMessage({
            action: 'saveConfig',
            data: {
                general: {
                    cacheLastCmd: false,
                    defaultPlugin: 'Other',
                    customCmd: query
                }
            }
        });
        window.stewardApp.applyCommand(query);
        Toast.success(chrome.i18n.getMessage('save_ok'));
    } else {
        Toast.warning(chrome.i18n.getMessage('custom_warning_notempty'));
    }
}

export default {
    version,
    name: 'Custom',
    category: 'steward',
    type,
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};