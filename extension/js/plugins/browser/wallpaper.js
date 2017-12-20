/**
 * @description search
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import Toast from 'toastr'
import { saveWallpaperLink, getDataURI } from '../../helper/wallpaper'
import { MODE } from '../../constant/base'

const name = 'wallpaper';
const key = 'wp';
const version = 2;
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
    },
    {
        icon: chrome.extension.getURL('img/download-red.png'),
        title: chrome.i18n.getMessage('wallpaper_action_download_title'),
        desc: chrome.i18n.getMessage('wallpaper_action_download_subtitle'),
        type: 'download'
    }
];
let actions = allActions;
const tips = [{
    icon,
    title: 'Please enter a wallpaper link ending with jpg or png',
    desc: 'Press Enter to add the link to your collections'
}];

let that;

function updateActions() {
    actions = allActions.filter(action => {
        if (action.selector) {
            return $(action.selector).is(':visible')
        } else {
            return true;
        }
    });

    actions.forEach(action => {
        if (action.selector === '#j-save-wplink') {
            action.desc = action.desc.replace('source', window.localStorage.getItem('wallpaper_source'));
        }
    });
}

function setup() {
    $('body').on('wallpaper:refreshed', () => {
        console.log('wallpaper:refreshed');
        updateActions();

        if (that && that.command && that.command.orkey === 'wp') {
            that.showItemList(actions);
        }
    });
    updateActions();
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
    if (action.selector) {
        $(action.selector).click();
    } else if(action.type === 'download') {
        downloadImage();
    }
}

function downloadImage() {
    getDataURI(window.localStorage.wallpaper).then(result => {
        const a = $('<a>')
            .hide()
            .attr('href', result)
            .attr('download', `stewardImage${Number(new Date())}.jpg`)
            .appendTo('body');

        a[0].click();

        a.remove();
    })
}

function saveWallpaper(link, command) {
    const reg = /(https?:\/\/.*\.(?:png|jpg|jpeg))/i;

    if (link.match(reg)) {
        return saveWallpaperLink(link).then(() => {
            updateActions();

            return `${command.key} `;
        }).catch(msg => {
            Toast.warning(msg);
        });
    } else {
        Toast.warning(chrome.i18n.getMessage('wallpaper_warning_format'));

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