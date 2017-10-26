/**
 * @description chrome urls
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'

const version = 1;
const name = 'steward';
const type = 'search';
const icon = chrome.extension.getURL('img/icon.png');
const title = chrome.i18n.getMessage(name + '_title');
const subtitle = chrome.i18n.getMessage(name + '_subtitle');
const baseUrl = chrome.extension.getURL('options.html') + '?tab=';

let stewardTabs;

if (EXT_TYPE === 'alfred') {
    stewardTabs = ['Plugins', 'Help', 'Update', 'About'];
} else {
    stewardTabs = ['General', 'Plugins', 'Appearance', 'Help', 'Update', 'About'];
}

function onInput(text) {
    const filterByName = (suggestions) => util.getMatches(suggestions, text);
    const mapTo = (type) => item => {
        return {
            icon,
            key: type,
            title: item,
            desc: `Steward ${item}`,
            url: baseUrl + item
        }
    };

    let tabs = filterByName(stewardTabs).map(mapTo('url'));

    return Promise.resolve(tabs);
}

function onEnter({ url }) {
    chrome.tabs.create({
        url
    });
}

export default {
    version,
    name: 'Steward',
    type,
    icon,
    title,
    onInput,
    onEnter
};