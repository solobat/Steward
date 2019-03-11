/**
 * @description chrome urls
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import util from '../../common/util'

const version = 1;
const name = 'chrome';
const type = 'search';
const icon = chrome.extension.getURL('iconfont/chrome.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const settingUrls = ["chrome://settings/people", "chrome://settings/appearance", "chrome://settings/search", "chrome://settings/defaultBrowser", "chrome://settings/onStartup", "chrome://settings/privacy", "chrome://settings/passwords", "chrome://settings/languages", "chrome://settings/downloads", "chrome://settings/printing", "chrome://settings/accessibility", "chrome://settings/system", "chrome://settings/reset", "chrome://settings/help"];
const chromeUrls = settingUrls.concat(["chrome://extensions/configureCommands", "chrome://extensions/shortcuts", "chrome://about", "chrome://accessibility", "chrome://appcache-internals", "chrome://apps", "chrome://blob-internals", "chrome://bluetooth-internals", "chrome://bookmarks", "chrome://cache", "chrome://chrome", "chrome://chrome-urls", "chrome://components", "chrome://crashes", "chrome://credits", "chrome://device-log", "chrome://devices", "chrome://dino", "chrome://dns", "chrome://downloads", "chrome://extensions", "chrome://flags", "chrome://flash", "chrome://gcm-internals", "chrome://gpu", "chrome://help", "chrome://histograms", "chrome://history", "chrome://indexeddb-internals", "chrome://inspect", "chrome://invalidations", "chrome://local-state", "chrome://media-engagement", "chrome://media-internals", "chrome://nacl", "chrome://net-export", "chrome://net-internals", "chrome://network-error", "chrome://network-errors", "chrome://newtab", "chrome://ntp-tiles-internals", "chrome://omnibox", "chrome://password-manager-internals", "chrome://policy", "chrome://predictors", "chrome://print", "chrome://profiler", "chrome://quota-internals", "chrome://safe-browsing", "chrome://serviceworker-internals", "chrome://settings", "chrome://signin-internals", "chrome://site-engagement", "chrome://suggestions", "chrome://supervised-user-internals", "chrome://sync-internals", "chrome://system", "chrome://taskscheduler-internals", "chrome://terms", "chrome://thumbnails", "chrome://tracing", "chrome://translate-internals", "chrome://usb-internals", "chrome://user-actions", "chrome://version", "chrome://view-http-cache", "chrome://webrtc-internals", "chrome://webrtc-logs"]);
const chromeDebug = ["chrome://badcastcrash/", "chrome://inducebrowsercrashforrealz/", "chrome://crash/", "chrome://crashdump/", "chrome://kill/", "chrome://hang/", "chrome://shorthang/", "chrome://gpuclean/", "chrome://gpucrash/", "chrome://gpuhang/", "chrome://memory-exhaust/", "chrome://ppapiflashcrash/", "chrome://ppapiflashhang/", "chrome://quit/", "chrome://restart/"];

function onInput(text) {
    const filterByName = suggestions => util.getMatches(suggestions, text);
    const mapTo = key => item => {
        return {
            icon,
            key,
            title: item.split('//')[1].replace('/', ' '),
            desc: item,
            url: item,
            weight: 3
        }
    };

    const pages = filterByName(chromeUrls).map(mapTo('url'));
    const actions = filterByName(chromeDebug).map(mapTo('copy'));

    return Promise.resolve(pages.concat(actions));
}

function onEnter(item, command, query, keyStatus) {
    util.createTab(item, keyStatus);
}

export default {
    version,
    name: 'Chrome',
    category: 'browser',
    type,
    icon,
    title,
    onInput,
    onEnter,
    canDisabled: false
};