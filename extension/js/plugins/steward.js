/**
 * @description chrome urls
 * @author  tomasy
 * @mail solopea@gmail.com
 */

/*global EXT_TYPE*/
import util from '../common/util'

const version = 1;
const name = 'steward';
const type = 'search';
const icon = chrome.extension.getURL('img/icon.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const baseUrl = chrome.extension.getURL('options.html');

let stewardTabs;

if (EXT_TYPE === 'alfred') {
    stewardTabs = ['Alfred', 'Plugins', 'Help', 'Update', 'About'];
} else {
    stewardTabs = ['Steward', 'General', 'Plugins', 'Appearance', 'Help', 'Update', 'About'];
}

function caseFormat(str) {
    return str[0].toUpperCase() + str.slice(1);
}

function onInput(text) {
    const filterByName = suggestions => util.getMatches(suggestions, text);
    const extType = caseFormat(EXT_TYPE);
    const mapTo = itemType => item => {
        return {
            icon,
            key: itemType,
            title: item,
            url: item === extType ? baseUrl : `${baseUrl}?tab=${item}`
        }
    };

    const tabs = filterByName(stewardTabs).map(mapTo('url'));

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