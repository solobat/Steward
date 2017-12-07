/**
 * @description search
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import Toast from 'toastr'
import { saveWallpaperLink } from '../../helper/wallpaper'
import { MODE } from '../../constant/base'

const name = 'wallpaper';
const key = 'wp';
const version = 1;
const type = 'keyword';
const icon = chrome.extension.getURL('img/wallpaper-icon.png');
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
const actions = [
    {
        icon: chrome.extension.getURL('img/save-red.png'),
        title: 'Save',
        desc: 'Save current wallpaper to your collections',
        selector: '#j-save-wplink'
    },
    {
        icon: chrome.extension.getURL('img/refresh-red.png'),
        title: 'Refresh',
        desc: 'Refresh wallpaper',
        selector: '#j-refresh-wp'
    }
];
const tips = [{
    icon,
    title: 'Please enter a wallpaper link ending with jpg or png',
    desc: 'Press Enter to add the link to your collections'
}];

function onInput(query) {
    if (!query && window.stewardCache.mode === MODE.NEWTAB) {
        return Promise.resolve(actions.filter(action => $(action.selector).is(':visible')));
    } else {
        return Promise.resolve(tips);
    }
}

function handleWallpaperAction(action) {
    $(action.selector).click();
}

function saveWallpaper(link, command) {
    const reg = /(https?:\/\/.*\.(?:png|jpg))/i;

    if (link.match(reg)) {
        return saveWallpaperLink(link).then(() => `${command.key} `).catch(msg => {
            Toast.warning(msg);
        });
    } else {
        Toast.warning('Image format is incorrect');

        return Promise.resolve(true);
    }
}

function onEnter(item, command, query) {
    if (query) {
        return saveWallpaper(query, command);
    } else {
        handleWallpaperAction(item);
    }
}

export default {
    version,
    name: 'Wallpaper',
    icon,
    title,
    onInput,
    onEnter,
    commands
};