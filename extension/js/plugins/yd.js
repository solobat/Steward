/**
 * @description translator power by youdao api
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'

const url = 'https://fanyi.youdao.com/openapi.do?' +
'keyfrom=mineword&key=1362458147&type=data&doctype=json&version=1.1&q=';
const emptyReg = /^\s+$/g;
const version = 2;
const name = 'youdao';
const key = 'yd';
const type = 'keyword';
const icon = chrome.extension.getURL('img/youdao.png');
const title = chrome.i18n.getMessage(name + '_title');
const subtitle = chrome.i18n.getMessage(name + '_subtitle');
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

function onInput(key) {
    if (emptyReg.test(key)) {
        return;
    }

    return getTranslation(key);
}

function onEnter({ title }) {
    util.copyToClipboard(title, true);
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

function getTranslation(key) {
    return new Promise(resolve => {
        $.get(url + key, function (data) {
            var retData = [];
            var phonetic = data.basic ? '[' + [
                data.basic.phonetic,
                data.basic['uk-phonetic'],
                data.basic['us-phonetic']
            ].join(',') + ']' : '';
    
            retData.push({
                text: (data.translation || []).join(';') + phonetic,
                note: '翻译结果'
            });
    
            var explains = data.basic && data.basic.explains && data.basic.explains.map(function (exp) {
                return {
                    text: exp,
                    note: '简明释义'
                };
            });
    
            var webs = data.web && data.web.map(function (web) {
                return {
                    text: web.value.join(', '),
                    note: '网络释义: ' + web.key
                };
            });
    
            retData = retData.concat(explains || []).concat(webs || []);
    
            resolve(dataFormat(retData));
        });
    });
}

export default {
    version,
    name: name,
    icon,
    title,
    commands,
    onInput,
    onEnter
};