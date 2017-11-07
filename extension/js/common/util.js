/**
 * @file util
 * @author tomasy
 * @email solopea@gmail.com
 */

import pinyin from 'pinyin'
import Toast from 'toastr'
import fuzzaldrinPlus from 'fuzzaldrin-plus'
import '../../../node_modules/toastr/toastr.scss'

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

function genCommands(name, icon, items, type) {
    return items.map(item => {
        const {key, editable, keyname} = item;

        return {
            key: item.key,
            type,
            orkey: item.key,
            title: chrome.i18n.getMessage(`${name}_${(keyname || key)}_title`),
            subtitle: chrome.i18n.getMessage(`${name}_${(keyname || key)}_subtitle`),
            icon,
            editable: editable !== false
        };
    });
}

function copyToClipboard(text, showMsg) {
    document.addEventListener('copy', event => {
        event.preventDefault();
        event.clipboardData.setData('text/plain', text);

        if (showMsg) {
            Toast.success(`"${text}" has been copied to the clipboard`);
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

export default {
    matchText,
    isMac,
    guid,
    genCommands,
    copyToClipboard,
    getMatches,
    getParameterByName,
    array2map,
    options2map
};
