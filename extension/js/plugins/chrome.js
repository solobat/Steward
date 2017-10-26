/**
 * @file del command script
 * @description delete extensions / apps by del command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'

const version = 1;
const name = 'chrome';
const type = 'search';
const icon = chrome.extension.getURL('img/chrome.png');
const title = chrome.i18n.getMessage(name + '_title');
const subtitle = chrome.i18n.getMessage(name + '_subtitle');
const chromeUrls = ["chrome://about", "chrome://accessibility", "chrome://appcache-internals", "chrome://apps", "chrome://blob-internals", "chrome://bluetooth-internals", "chrome://bookmarks", "chrome://cache", "chrome://chrome", "chrome://chrome-urls", "chrome://components", "chrome://crashes", "chrome://credits", "chrome://device-log", "chrome://devices", "chrome://dino", "chrome://dns", "chrome://downloads", "chrome://extensions", "chrome://flags", "chrome://flash", "chrome://gcm-internals", "chrome://gpu", "chrome://help", "chrome://histograms", "chrome://history", "chrome://indexeddb-internals", "chrome://inspect", "chrome://invalidations", "chrome://local-state", "chrome://media-engagement", "chrome://media-internals", "chrome://nacl", "chrome://net-export", "chrome://net-internals", "chrome://network-error", "chrome://network-errors", "chrome://newtab", "chrome://ntp-tiles-internals", "chrome://omnibox", "chrome://password-manager-internals", "chrome://policy", "chrome://predictors", "chrome://print", "chrome://profiler", "chrome://quota-internals", "chrome://safe-browsing", "chrome://serviceworker-internals", "chrome://settings", "chrome://signin-internals", "chrome://site-engagement", "chrome://suggestions", "chrome://supervised-user-internals", "chrome://sync-internals", "chrome://system", "chrome://taskscheduler-internals", "chrome://terms", "chrome://thumbnails", "chrome://tracing", "chrome://translate-internals", "chrome://usb-internals", "chrome://user-actions", "chrome://version", "chrome://view-http-cache", "chrome://webrtc-internals", "chrome://webrtc-logs"];
const chromeDebug = ["chrome://badcastcrash/", "chrome://inducebrowsercrashforrealz/", "chrome://crash/", "chrome://crashdump/", "chrome://kill/", "chrome://hang/", "chrome://shorthang/", "chrome://gpuclean/", "chrome://gpucrash/", "chrome://gpuhang/", "chrome://memory-exhaust/", "chrome://ppapiflashcrash/", "chrome://ppapiflashhang/", "chrome://quit/", "chrome://restart/"];

function onInput(text) {
    const filterByName = (suggestions) => util.getMatches(suggestions, text);
    const mapTo = (type) => item => {
        return {
            icon,
            key: type,
            title: item.split('//')[1].replace('/', ''),
            desc: item,
            url: item
        }
    };

    let pages = filterByName(chromeUrls).map(mapTo('url'));
    let actions = filterByName(chromeDebug).map(mapTo('copy'));

    return Promise.resolve(pages.concat(actions));
}

function onEnter({ url }) {
    chrome.tabs.create({
        url
    });
}

export default {
    version,
    name: 'Chrome',
    type,
    icon,
    title,
    onInput,
    onEnter
};