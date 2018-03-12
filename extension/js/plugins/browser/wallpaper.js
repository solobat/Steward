/**
 * @description search
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import Toast from 'toastr'
import { saveWallpaperLink, getDataURI } from '../../helper/wallpaper'
import { MODE } from '../../constant/base'
import STORAGE from '../../constant/storage'
import util from '../../common/util'
import browser from 'webextension-polyfill'

const name = 'wallpaper';
const keys = [
    { key: 'wp' },
    { key: 'wps' }
];
const version = 3;
const type = 'keyword';
const icon = chrome.extension.getURL('img/wallpaper-icon.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);
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
    },
    {
        icon: chrome.extension.getURL('img/copy.png'),
        title: chrome.i18n.getMessage('wallpaper_action_copy_title'),
        desc: '',
        url: '',
        universal: true,
        key: 'copy'
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
        } else if (action.key === 'copy') {
            const url = window.localStorage.getItem('wallpaper');

            action.url = url;
            action.desc = url;
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

function isNewTab() {
    return window.stewardCache.mode === MODE.NEWTAB;
}

function isInPage() {
    return window.parent !== window;
}

function handleWpInput(query) {
    if (!query && isNewTab()) {
        return Promise.resolve(actions);
    } else {
        return Promise.resolve(tips);
    }
}

function fixImgUrl(rawUrl) {
    const inPage = isInPage();
    let url = rawUrl;

    if (inPage && url.indexOf('http://') !== -1) {
        url = url.replace('http://', 'https://');
    }

    return url;
}

function handleWpsInput(query, command) {
    return browser.storage.sync.get(STORAGE.WALLPAPERS).then(resp => {
        let list = resp[STORAGE.WALLPAPERS];

        if (query) {
            list = list.filter(item => item.indexOf(query) !== -1);
        }


        return list.map(item => {
            const url = fixImgUrl(item);

            return {
                icon: url,
                title: item,
                url: item,
                desc: command.subtitle
            };
        });
    });
}

function onInput(query, command) {
    that = this;
    const orkey = command.orkey;

    if (orkey === 'wp') {
        return handleWpInput(query);
    } else if (orkey === 'wps') {
        return handleWpsInput(query, command);
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

function handleWpEnter(item, query, command) {
    if (query) {
        return saveWallpaper(query, command);
    } else {
        handleWallpaperAction(item);
    }
}

function handleWpsEnter(item) {
    const url = item.url;

    if (isNewTab()) {
        $('body').trigger('wallpaper:update', url);
    } else {
        window.localStorage.setItem(STORAGE.WALLPAPER, url);
    }
}

function onEnter(item, command, query) {
    const orkey = command.orkey;

    if (orkey === 'wp') {
        return handleWpEnter(item, query, command);
    } else if (orkey === 'wps') {
        return handleWpsEnter(item, command);
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