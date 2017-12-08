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
const allActions = [
    {
        icon: chrome.extension.getURL('img/save-red.png'),
        title: chrome.i18n.getMessage('wallpaper_action_save_title'),
        desc: chrome.i18n.getMessage('wallpaper_action_save_subtitle'),
        selector: '#j-save-wplink'
    },
    {
        icon: chrome.extension.getURL('img/refresh-red.png'),
        title: chrome.i18n.getMessage('wallpaper_action_refresh_title'),
        desc: chrome.i18n.getMessage('wallpaper_action_refresh_subtitle'),
        selector: '#j-refresh-wp'
    }
];
let actions = allActions;
const tips = [{
    icon,
    title: 'Please enter a wallpaper link ending with jpg or png',
    desc: 'Press Enter to add the link to your collections'
}];

let that;

function setup() {
    $('body').on('wallpaper:refreshed', () => {
        console.log('wallpaper:refreshed');
        actions = allActions.filter(action => $(action.selector).is(':visible'));

        if (that && that.command && that.command.orkey === 'wp') {
            that.showItemList(actions);
        }
    });
}

setup();

function onInput(query) {
    that = this;

    if (!query && window.stewardCache.mode === MODE.NEWTAB) {
        return Promise.resolve(actions);
    } else {
        return Promise.resolve(tips);
    }
}

function handleWallpaperAction(action) {
    $(action.selector).click();
}

function saveWallpaper(link, command) {
    const reg = /(https?:\/\/.*\.(?:png|jpg|jpeg))/i;

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