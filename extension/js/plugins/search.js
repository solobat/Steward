/**
 * @description search
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'

const name = 'search';
const key = 'search';
const version = 1;
const type = 'other';
const icon = chrome.extension.getURL('img/google.png');
const title = chrome.i18n.getMessage(name + '_title');
const subtitle = chrome.i18n.getMessage(name + '_subtitle');
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: false
}];
const searchMap = {
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
    'Zhihu': {
        url: 'https://www.zhihu.com/search?type=content&q=',
        icon: chrome.extension.getURL('img/zhihu.png')
    },
    'Stack Overflow': {
        url: 'https://stackoverflow.com/search?q=',
        icon: chrome.extension.getURL('img/stackoverflow.png')
    }
};

function onInput(query) {
    let data = Object.keys(searchMap).map(engine => {
        return {
            key: 'search',
            query,
            engine,
            icon: searchMap[engine].icon,
            title: `Search ${engine} for: ${query}`
        };
    });

    return data;
}

function onEnter({ query, engine }) {
    let url = searchMap[engine].url + query.split(' ').join('+');
    
    chrome.tabs.create({
        url
    });
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