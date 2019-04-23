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
import URLSearchParams from '@ungap/url-search-params'

function getPinyin(name) {
    return pinyin(name, {
        style: pinyin.STYLE_NORMAL

    }).join('');
}

function matchText(key, str) {
    const text = getPinyin(str.toLowerCase());

    if (!key || str.indexOf(key) > -1 || text.indexOf(key) > -1) {
        return true;
    } else {
        const plainKey = key.replace(/\s/g, '');
        const keys = plainKey.split('').join('.*');
        const reg = new RegExp(`.*${keys}.*`);

        return reg.test(text);
    }
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
        const {key, editable, keyname, allowBatch, shiftKey, workflow, weight} = item;

        return {
            key: item.key,
            type,
            orkey: item.key,
            title: chrome.i18n.getMessage(`${name}_${(keyname || key)}_title`),
            subtitle: chrome.i18n.getMessage(`${name}_${(keyname || key)}_subtitle`),
            icon,
            allowBatch,
            workflow,
            weight,
            shiftKey,
            editable: editable !== false
        };
    });
}

function getDefaultResult(command) {
    return [{
        isDefault: true,
        icon: command.icon,
        title: command.title,
        desc: command.subtitle
    }];
}

const loadingIcon = chrome.extension.getURL('iconfont/loading.svg');

function getLoadingResult(command) {
    let theCommand;

    if (!command) {
        theCommand = window.stewardApp.getCurrentCommand();
    }

    if (theCommand) {
        return [{
            icon: theCommand.icon,
            title: theCommand.title,
            desc: 'Loading...',
            isDefault: true
        }];
    } else {
        return [{
            icon: loadingIcon,
            title: 'Loading....',
            isDefault: true
        }];
    }
}

function getEmptyResult(command, msg) {
    return [{
        isDefault: true,
        icon: command.icon,
        title: msg || 'No query results...'
    }];
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

const batchExecutionIfNeeded = (predicate, [exec4batch, exec], [list, item], keyStatus,
    maxOperandsNum = window.stewardCache.config.general.maxOperandsNum) => {
    const results = [];

    if (predicate || item instanceof Array) {
        const num = predicate ? maxOperandsNum : item.length;

        results.push(list.slice(0, num).forEach(exec4batch));
    } else {
        results.push(exec(item, keyStatus));
    }

    return Promise.all(results);
}

const createTab = (item, keyStatus = {}) => {
    const { mode, inContent } = window.stewardApp;

    if (mode === 'popup' && !inContent) {
        chrome.tabs.create({ url: item.url });
    } else {
        if (keyStatus.metaKey) {
            chrome.tabs.getCurrent(tab => {
                chrome.tabs.update(tab.id, {
                    url: item.url
                });
            });
        } else {
            chrome.tabs.create({ url: item.url });
        }
    }
}

const tabCreateExecs = [
    item => {
        chrome.tabs.create({ url: item.url, active: false });
        window.slogs.push(`open ${item.url}`);
    },
    (item, keyStatus = {}) => {
        createTab(item, keyStatus);
        
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

function getDocumentURL(name, category) {
    const lang = getLang();
    let baseUrl;
    const fixedName = name.replace(/\s/, '-');

    if (lang === 'en') {
        baseUrl = `http://oksteward.com/steward-documents/plugins/${category}`;
    } else {
        baseUrl = `http://oksteward.com/steward-documents/zh/plugins/${category}`;
    }

    return `${baseUrl}/${fixedName}.html`;
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
        return Promise.reject('Storage is full, can not be added!');
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
    const nums = [6, 8, 66, 88, 666, 888];
    const random = Math.floor(Math.random() * 1000);
    console.log(random);

    if (nums.indexOf(random) !== -1) {
        return true;
    } else {
        return false;
    }
}

function simTemplate(tpl, data) {
    return tpl.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, function(m, $1) {
        return typeof data[$1] !== 'undefined' ? data[$1] : '';
    });
}

const getData = field => () => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: field
        }, resp => {
            if (resp) {
                resolve(resp.data);
            } else {
                reject(null);
            }
        });
    });
}

function getTplMsg(tplKey, data) {
    return simTemplate(chrome.i18n.getMessage(tplKey), data);
}

function getTextMsg(tplKey, textKey) {
    const data = {
        text: chrome.i18n.getMessage(textKey)
    };

    return getTplMsg(tplKey, data);
}

function getURLParams(keys, search = window.location.search) {
    const searchParams = new URLSearchParams(search);

    return keys.reduce((obj, key) => {
      obj[key] = searchParams.get(key);

      return obj;
    }, {});
}

export default {
    matchText,
    isMac,
    guid,
    simpleCommand,
    getTplMsg,
    getTextMsg,
    genCommands,
    getDefaultResult,
    getLoadingResult,
    getEmptyResult,
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
    shouldSupportMe,
    simTemplate,
    getData,
    createTab,
    toast: Toast,
    getURLParams
};
