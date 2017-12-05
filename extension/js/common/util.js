/**
 * @file util
 * @author tomasy
 * @email solopea@gmail.com
 */

import pinyin from 'pinyin'
import Toast from 'toastr'
import fuzzaldrinPlus from 'fuzzaldrin-plus'
import '../../../node_modules/toastr/toastr.scss'
import { QUOTA_BYTES_PER_ITEM } from '../constant/number'

function getPinyin(name) {
    return pinyin(name, {
        style: pinyin.STYLE_NORMAL

    }).join('');
}

function matchText(key, str) {
    const text = getPinyin(str.toLowerCase());

    if (!key) {
        return true;
    }

    if (text.indexOf(key) > -1) {
        return true;
    }

    const plainKey = key.replace(/\s/g, '');
    const keys = plainKey.split('').join('.*');
    const reg = new RegExp(`.*${keys}.*`);

    return reg.test(text);
}

const isMac = navigator.platform === 'MacIntel';

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

const simpleCommand = ({key, orkey}) => {
    return {
        key,
        orkey
    };
}

function genCommands(name, icon, items, type) {
    return items.map(item => {
        const {key, editable, keyname, allowBatch, shiftKey} = item;

        return {
            key: item.key,
            type,
            orkey: item.key,
            title: chrome.i18n.getMessage(`${name}_${(keyname || key)}_title`),
            subtitle: chrome.i18n.getMessage(`${name}_${(keyname || key)}_subtitle`),
            icon,
            allowBatch,
            shiftKey,
            editable: editable !== false
        };
    });
}

function copyToClipboard(text, showMsg) {
    document.addEventListener('copy', event => {
        event.preventDefault();
        event.clipboardData.setData('text/plain', text);

        if (showMsg) {
            Toast.success(`"${text}" has been copied to the clipboard`, '', { timeOut: 1000 });
        }
    }, {once: true});

    document.execCommand('copy');
}

function getMatches(suggestions, query, key) {
    const matches = fuzzaldrinPlus.filter(suggestions, query, {maxResults: 20, usePathScoring: true, key});

    return matches;
}

function getParameterByName(name, search = window.location.search) {
    const urlsearch = new URLSearchParams(search);

    return urlsearch.get(name);
}

const array2map = (keyField, valField) => arr => {
    const ret = {};

    arr.forEach(item => {
        if (valField) {
            ret[item[keyField]] = item[valField];
        } else {
            ret[item[keyField]] = item;
        }
    });

    return ret;
};

const options2map = array2map('value', 'label');

const wrapWithMaxNumIfNeeded = (field,
     maxOperandsNum = window.stewardCache.config.general.maxOperandsNum) => (item, index) => {
    let ret = field ? item[field] : item;

    if (index < maxOperandsNum) {
        ret = `⇧: ${ret}`;
    }

    return ret;
}

const batchExecutionIfNeeded = (predicate, [exec4batch, exec], [list, item],
    maxOperandsNum = window.stewardCache.config.general.maxOperandsNum) => {
    if (predicate || item instanceof Array) {
        const num = predicate ? maxOperandsNum : item.length;

        list.slice(0, num).forEach(exec4batch);
    } else {
        exec(item);
    }
}

const tabCreateExecs = [
    item => {
        chrome.tabs.create({ url: item.url, active: false });
        window.slogs.push(`open ${item.url}`);
    },
    item => {
        chrome.tabs.create({ url: item.url });
        window.slogs.push(`open ${item.url}`);
    }
];

function getLang() {
    if (chrome.i18n.getUILanguage().indexOf('zh') > -1) {
        return 'zh';
    } else {
        return 'en';
    }
}

function getDocumentURL(name) {
    const lang = getLang();
    const baseUrl = `http://oksteward.com/steward-document-${lang}/plugins`;
    const exts = ['wordcard'];

    if (exts.indexOf(name) === -1) {
        return `${baseUrl}/browser/${name}.html`;
    } else {
        return `${baseUrl}/browser/extension/${name}.html`;
    }
}

function getBytesInUse(key) {
    return new Promise(resolve => {
        chrome.storage.sync.getBytesInUse(key, resp => {
            console.log(resp);
            resolve(resp);
        });
    });
}

function isStorageSafe(key) {
    if (!key) {
        return Promise.reject();
    } else {
        return getBytesInUse(key).then(size => {
            const safetyFactor = 0.85;
            console.log(`${key} size: ${size}`);

            if (size > (QUOTA_BYTES_PER_ITEM * safetyFactor)) {
                return Promise.reject();
            } else {
                return true;
            }
        });
    }
}

function shouldSupportMe() {
    const nums = [6, 66];
    const random = Math.floor(Math.random() * 100);
    console.log(random);

    if (nums.indexOf(random) !== -1) {
        return true;
    } else {
        return false;
    }
}

export default {
    matchText,
    isMac,
    guid,
    simpleCommand,
    genCommands,
    copyToClipboard,
    getMatches,
    getParameterByName,
    array2map,
    options2map,
    wrapWithMaxNumIfNeeded,
    batchExecutionIfNeeded,
    tabCreateExecs,
    getDocumentURL,
    isStorageSafe,
    shouldSupportMe
};
