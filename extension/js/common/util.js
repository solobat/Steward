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
        style: pinyin['STYLE_NORMAL']

    }).join('');
}

function matchText(key, text) {
    text = getPinyin(text.toLowerCase());

    if (!key) {
        return true;
    }

    if (text.indexOf(key) > -1) {
        return true;
    }

    var plainKey = key.replace(/\s/g, '');
    var reg = new RegExp('.*' + plainKey.split('').join('.*') + '.*');

    return reg.test(text);
}

var isMac = navigator.platform === 'MacIntel';

function guid() {
    function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function genCommands(name, icon, items, type) {
    return items.map(item => {
        let {key, editable, keyname} = item;

        return {
            key: item.key,
            type,
            orkey: item.key,
            title: chrome.i18n.getMessage(name + '_' + (keyname || key) + '_title'),
            subtitle: chrome.i18n.getMessage(name + '_' + (keyname || key) + '_subtitle'),
            icon,
            editable: editable === false ? false : true
        };
    });
}

function copyToClipboard(text, showMsg) {
    document.addEventListener('copy', (event) => {
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
    let urlsearch = new URLSearchParams(search);

    return urlsearch.get(name);
}

const array2map = (keyField, valField) => (arr) => {
    let ret = {};

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
    matchText: matchText,
    isMac: isMac,
    guid: guid,
    genCommands,
    copyToClipboard,
    getMatches,
    getParameterByName,
    array2map,
    options2map
};
