/**
 * @file del command script
 * @description delete extensions / apps by del command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'

var name = 'search';
var key = 'search';
var version = 1;
var type = 'other';
var icon = chrome.extension.getURL('img/google.png');
var title = chrome.i18n.getMessage(name + '_title');
var subtitle = chrome.i18n.getMessage(name + '_subtitle');
var commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: false
}];
var searchMap = {
    'Google': {
        url: 'https://www.google.com/search?q=',
        icon: chrome.extension.getURL('img/google.png')
    },
    '百度': {
        url: 'https://www.baidu.com/s?wd=',
        icon: chrome.extension.getURL('img/baidu.png')
    },
    'Bing': {
        url: 'https://bing.com/search?q=',
        icon: chrome.extension.getURL('img/bing.png')
    },
    '知乎': {
        url: 'https://www.zhihu.com/search?type=content&q=',
        icon: chrome.extension.getURL('img/zhihu.png')
    },
    'Stack Overflow': {
        url: 'https://stackoverflow.com/search?q=',
        icon: chrome.extension.getURL('img/stackoverflow.png')
    }
};

function onInput(query) {
    var data = Object.keys(searchMap).map(engine => {
        return {
            key: 'search',
            query,
            engine,
            icon: searchMap[engine].icon,
            title: `Search ${engine} for: ${query}`,
            desc: subtitle
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