/**
 * @description search
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import util from '../../common/util'
import browser from 'webextension-polyfill'
import Toast from 'toastr'
import _ from 'underscore'

const name = 'search';
const key = 'search';
const version = 2;
const type = 'other';
const icon = chrome.extension.getURL('iconfont/google.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    shiftKey: true,
    editable: false
}, {
    key: 'se',
    type: 'keyword',
    title: chrome.i18n.getMessage(`${name}_se_title`),
    subtitle: chrome.i18n.getMessage(`${name}_se_subtitle`),
    icon,
    editable: true
}];
const defaultSearchEngines = {
    'Google': {
        url: 'https://www.google.com/search?q=%s',
        icon: chrome.extension.getURL('iconfont/google.svg')
    },
    'Baidu': {
        url: 'https://www.baidu.com/s?wd=%s',
        icon: chrome.extension.getURL('iconfont/baidu.svg')
    },
    'Bing': {
        url: 'https://bing.com/search?q=%s',
        icon: chrome.extension.getURL('iconfont/bing.svg')
    },
    'Stack Overflow': {
        url: 'https://stackoverflow.com/search?q=%s',
        icon: chrome.extension.getURL('iconfont/stackoverflow.svg')
    }
};

let searchEngines;

function getSyncEngines() {
    if (searchEngines) {
        return Promise.resolve(searchEngines);
    } else {
        return browser.storage.sync.get('engines').then(res => {
            let engines;

            if (res.engines) {
                engines = res.engines;
            } else {
                engines = defaultSearchEngines;
                browser.storage.sync.set({
                    engines
                });
            }
            console.log(engines);

            searchEngines = engines;

            return engines;
        });
    }
}

function getIcon(engineName, rawIcon) {
    if (defaultSearchEngines[engineName]) {
        return defaultSearchEngines[engineName].icon;
    } else {
        return rawIcon;
    }
}

function getSearchLinks(query) {
    return getSyncEngines().then(engines => {
        return Object.keys(engines).map(engine => {
            return {
                key: 'search',
                query,
                engine,
                count: engines[engine].count || 0,
                engineUrl: engines[engine].url,
                icon: getIcon(engine, engines[engine].icon),
                title: `Search ${engine} for: ${query}`
            };
        });
    }).then(results => {
        if (window.parentHost) {
            const index = results.findIndex(item => item.engineUrl.indexOf(window.parentHost) !== -1);

            if (index !== -1) {
                const item = results.splice(index, 1)[0];

                results.unshift(item);

                return results;
            } else {
                return results;
            }
        } else {
            return results;
        }
    });
}

function getSearchEngines() {
    const desc = chrome.i18n.getMessage('search_removese_subtitle');

    return getSyncEngines().then(engines => {
        return Object.keys(engines).map(engine => {
            const info = engines[engine];

            return {
                key: 'plugin',
                icon: info.icon,
                title: engine,
                url: info.url,
                desc
            };
        });
    });
}

function onInput(query, command) {
    if (command.orkey === 'search') {
        if (query) {
            return getSearchLinks(query).then(links => _.sortBy(links, 'count').reverse());
        } else {
            return [];
        }
    } else {
        if (query) {
            return util.getDefaultResult(command);
        } else {
            return getSearchEngines().then(engines => {
                if (engines && Object.keys(engines).length) {
                    return engines;
                } else {
                    return util.getDefaultResult(command);
                }
            });
        }
    }
}

function updateEngineStat(engine) {
    const oldCount = searchEngines[engine].count || 0;

    searchEngines[engine].count = oldCount + 1;

    console.log(searchEngines);
    return browser.storage.sync.set({ engines: searchEngines });
}

function gotoSearch(item, query, keyStatus) {
    const searchUrl = searchEngines[item.engine].url;
    const fixedQuery = query.split(' ').join('+');
    let url;

    if (searchUrl.indexOf('%s') !== -1) {
        url = searchUrl.replace('%s', fixedQuery);
    } else {
        url = searchUrl + fixedQuery;
    }

    util.createTab({ url }, keyStatus);

    updateEngineStat(item.engine);
}

function addNewEngine(str, command) {
    const parts = str.split(/[|]/);

    if (parts.length !== 3) {
        Toast.warning(chrome.i18n.getMessage('search_warning_format'));
    } else {
        const [ename, eurl, eicon] = parts;

        if (searchEngines[ename]) {
            Toast.warning(chrome.i18n.getMessage('not_add_repeatedly'));
        } else {
            searchEngines[ename] = {
                url: eurl,
                icon: eicon
            };
        }

        return browser.storage.sync.set({ engines: searchEngines }).then(() => {
            Toast.success(chrome.i18n.getMessage('add_ok'));
            return `${command.key} `;
        });
    }
}

function deleteEngine(item) {
    if (window.confirm(chrome.i18n.getMessage('search_warning_del'))) {
        Reflect.deleteProperty(searchEngines, item.title);
        util.copyToClipboard(`${item.title}|${item.url}|${item.icon}`, true);

        return browser.storage.sync.set({ engines: searchEngines }).then(() => {
            Toast.success(chrome.i18n.getMessage('delete_ok'));
            return '';
        });
    }
}

function handleEnginesUpdate(item, query, command) {
    if (query) {
        return addNewEngine(query, command);
    } else {
        return deleteEngine(item);
    }
}

function onEnter(item, command, query, keyStatus, list) {
    const { shiftKey } = keyStatus;

    if (command.orkey === 'se') {
        return handleEnginesUpdate(item, query, command);
    } else {
        if (shiftKey) {
            list.forEach(eitem => gotoSearch(eitem, this.str));
        } else {
            gotoSearch(item, this.str, keyStatus);
        }
    }
}

export default {
    version,
    name: 'Search',
    category: 'other',
    icon,
    title,
    onInput,
    onEnter,
    commands,
    canDisabled: false
};