/**
 * @description translator power by youdao api
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import util from '../../common/util'
import Toast from 'toastr'

const url = 'https://fanyi.youdao.com/openapi.do?' +
'keyfrom=mineword&key=1362458147&type=data&doctype=json&version=1.1&q=';
const emptyReg = /^\s+$/g;
const version = 3;
const name = 'youdao';
const key = 'yd';
const type = 'keyword';
const icon = chrome.extension.getURL('img/youdao.png');
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

function onInput(query) {
    if (emptyReg.test(query)) {
        return;
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

function onEnter(item, command, query, shiftKey) {
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

function dataFormat(rawList) {
    return rawList.map(function (item) {
        return {
            key: key,
            id: item.id,
            icon: icon,
            title: item.text,
            desc: item.note
        };
    });
}

function getTranslation(query) {
    return new Promise(resolve => {
        if (query) {
            $.get(url + query, function (data) {
                let retData = [];
                const str = [
                    data.basic.phonetic,
                    data.basic['uk-phonetic'],
                    data.basic['us-phonetic']
                ].join(',');
                const phonetic = data.basic ? `[${str}]` : '';

                retData.push({
                    text: (data.translation || []).join(';') + phonetic,
                    note: '翻译结果'
                });

                const explains = data.basic && data.basic.explains && data.basic.explains.map(function (exp) {
                    return {
                        text: exp,
                        note: '简明释义'
                    };
                });

                const webs = data.web && data.web.map(function (web) {
                    return {
                        text: web.value.join(', '),
                        note: `网络释义: ${web.key}`
                    };
                });

                retData = retData.concat(explains || []).concat(webs || []);

                resolve(dataFormat(retData));
            });
        } else {
            resolve([]);
        }
    });
}

export default {
    version,
    name,
    icon,
    title,
    commands,
    onInput,
    onEnter
};