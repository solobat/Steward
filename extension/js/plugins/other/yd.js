/**
 * @description translator power by youdao api
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import Toast from 'toastr'
import { google } from 'translation.js'

const emptyReg = /^\s+$/g;
const version = 3;
const name = 'youdao';
const key = 'yd';
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/youdao.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    shiftKey: true,
    editable: true
}];

function onInput(query, command) {
    if (emptyReg.test(query)) {
        return util.getDefaultResult(command);
    }

    return getTranslation(query);
}

function add2wordcard(wordName, transStr) {
    const extId = window.stewardCache.wordcardExtId;

    if (extId) {
        if (wordName && transStr) {
            const trans = transStr.replace(/\[.+\]/, '').split(/[；;,，]/).map(item => item.trim());

            chrome.runtime.sendMessage(extId, {
                action: 'create',
                data: {
                    name: wordName,
                    trans: trans || [],
                    tags: ['Steward']
                }
            }, () => {
                Toast.success(`「${wordName}」成功保存到单词小卡片!`);
            });
        } else {
            Toast.warning('单词与释义是必需的！');
        }
    } else {
        Toast.warning('没有找到单词小卡片扩展！');
    }
}

function onEnter(item, command, query, { shiftKey }) {
    if (query) {
        if (shiftKey) {
            add2wordcard(query, item.title);

            return Promise.resolve(true);
        } else {
            util.copyToClipboard(item.title, true);

            return Promise.resolve(false);
        }
    } else {
        return Promise.resolve(true);
    }
}

function dataFormat(rawList = []) {
    return rawList.map(function (item, index) {
        return {
            key: key,
            id: index,
            icon: icon,
            title: item
        };
    });
}

let transTimer = 0;

function getTranslation(query) {
    return new Promise(resolve => {
        clearTimeout(transTimer);

        if (query) {
            transTimer = setTimeout(() => {
                resolve(google.translate(query).then(resp => {
                    return dataFormat(resp.dict);
                }));
            }, 500);
        } else {
            resolve([]);
        }
    });
}

export default {
    version,
    name,
    category: 'other',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: true
};