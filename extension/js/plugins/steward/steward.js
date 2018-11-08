/**
 * @description chrome urls
 * @author  tomasy
 * @mail solopea@gmail.com
 */

/*global EXT_TYPE*/
import util from '../../common/util'
import { stewardTabs, stewardLiteTabs } from '../../constant/base'

const version = 1;
const name = 'steward';
const type = 'search';
const icon = chrome.extension.getURL('img/icon.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const baseUrl = chrome.extension.getURL('options.html');

let optionTabs;

if (EXT_TYPE === 'stewardlite') {
    optionTabs = stewardLiteTabs;
} else {
    optionTabs = stewardTabs;
}

optionTabs.push('Backup');

function caseFormat(str) {
    return str[0].toUpperCase() + str.slice(1);
}

function onInput(text) {
    const filterByName = suggestions => util.getMatches(suggestions, text);
    const extType = caseFormat(EXT_TYPE);
    const mapTo = itemType => item => {
        const isBackup = item === 'Backup';

        return {
            icon,
            key: isBackup ? 'app' : itemType,
            title: item,
            url: item === extType ? baseUrl : `${baseUrl}?tab=${item}`
        }
    };

    const tabs = filterByName(optionTabs).map(mapTo('url'));

    return Promise.resolve(tabs);
}

function onEnter() {

}

export default {
    version,
    name: 'Steward',
    category: 'steward',
    type,
    icon,
    title,
    onInput,
    onEnter,
    canDisabled: false
};