/**
 * @description search
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import browser from 'webextension-polyfill'
import Toast from 'toastr'

const name = 'search';
const key = 'search';
const version = 2;
const type = 'other';
const icon = chrome.extension.getURL('img/google.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
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
        url: 'https://www.google.com/search?q=',
        icon: chrome.extension.getURL('img/google.png')
    },
    'Baidu': {
        url: 'https://www.baidu.com/s?wd=',
        icon: chrome.extension.getURL('img/baidu.png')
    },
    'Bing': {
        url: 'https://bing.com/search?q=',
        icon: chrome.extension.getURL('img/bing.png')
    },
    'Stack Overflow': {
        url: 'https://stackoverflow.com/search?q=',
        icon: chrome.extension.getURL('img/stackoverflow.png')
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

function getSearchLinks(query) {
    return getSyncEngines().then(engines => {
        return Object.keys(engines).map(engine => {
            return {
                key: 'search',
                query,
                engine,
                icon: engines[engine].icon,
                title: `Search ${engine} for: ${query}`
            };
        });
    });
}

function getSearchEngines() {
    return getSyncEngines().then(engines => {
        return Object.keys(engines).map(engine => {
            const info = engines[engine];

            return {
                key: 'plugin',
                icon: info.icon,
                title: engine,
                desc: info.url
            };
        });
    });
}

function onInput(query, command) {
    if (command.orkey === 'search') {
        return getSearchLinks(query);
    } else {
        return getSearchEngines();
    }
}

function gotoSearch(item, query) {
    const url = searchEngines[item.engine].url + query.split(' ').join('+');

    chrome.tabs.create({
        url
    });
}

function addNewEngine(str, command) {
    const parts = str.split(/[|]/);

    if (parts.length !== 3) {
        Toast.warning(`
            The format of the new engine is wrong, <br>
            it should be like this: Name|Url|Icon,<br>
        `);
    } else {
        const [ename, eurl, eicon] = parts;

        if (searchEngines[ename]) {
            Toast.warning('Can not be added repeatedly');
        } else {
            searchEngines[ename] = {
                url: eurl,
                icon: eicon
            };
        }

        return browser.storage.sync.set({ engines: searchEngines }).then(() => {
            Toast.success('Add search engine success');
            return `${command.key} `;
        });
    }
}

function deleteEngine(item) {
    Reflect.deleteProperty(searchEngines, item.title);

    return browser.storage.sync.set({ engines: searchEngines }).then(() => {
        Toast.success('Delete search engine success');
        return '';
    });
}

function handleEnginesUpdate(item, query, command) {
    if (query) {
        return addNewEngine(query, command);
    } else {
        return deleteEngine(item);
    }
}

function onEnter(item, command, query) {
    if (command.orkey === 'se') {
        return handleEnginesUpdate(item, query, command);
    } else {
        gotoSearch(item, this.str);
    }
}

export default {
    version,
    name: 'Search',
    icon,
    title,
    onInput,
    onEnter,
    commands
};